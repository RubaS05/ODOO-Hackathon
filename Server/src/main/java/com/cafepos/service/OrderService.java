package com.cafepos.service;

import com.cafepos.dto.OrderCreateRequest;
import com.cafepos.dto.OrderDto;
import com.cafepos.entity.*;
import com.cafepos.enums.KitchenStatus;
import com.cafepos.enums.OrderStatus;
import com.cafepos.enums.SessionStatus;
import com.cafepos.repository.*;
import com.cafepos.websocket.KdsWebSocketHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final PosOrderRepository orderRepository;
    private final PosSessionRepository sessionRepository;
    private final ProductRepository productRepository;
    private final RestaurantTableRepository tableRepository;
    private final CustomerRepository customerRepository;
    private final ReceiptService receiptService;
    private final EmailService emailService;
    private final KdsWebSocketHandler kdsWebSocketHandler;
    private final AppUserRepository appUserRepository;

    @Transactional
    public OrderDto createOrder(AppUser employee, OrderCreateRequest request) {
        PosSession session = sessionRepository.findById(request.getSessionId())
            .orElseThrow(() -> new RuntimeException("Session not found: " + request.getSessionId()));

        PosOrder order = new PosOrder();
        order.setEmployee(employee);
        order.setSession(session);
        order.setOrderType(request.getOrderType() != null ? request.getOrderType() : "dine-in");
        order.setNotes(request.getNotes());
        order.setOrderDate(LocalDateTime.now());

        // Generate order number
        String orderNumber = "ORD-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss"));
        order.setOrderNumber(orderNumber);

        // Link table if provided
        if (request.getTableId() != null) {
            RestaurantTable table = tableRepository.findById(request.getTableId()).orElse(null);
            order.setTable(table);
        }

        // Link customer if provided by ID
        if (request.getCustomerId() != null) {
            Customer customer = customerRepository.findById(request.getCustomerId()).orElse(null);
            order.setCustomer(customer);
        } else if (request.getCustomerEmail() != null && !request.getCustomerEmail().isBlank()) {
            // Find or create customer by email
            Customer customer = customerRepository.findByEmail(request.getCustomerEmail()).orElseGet(() -> {
                Customer newCust = new Customer();
                newCust.setEmail(request.getCustomerEmail());
                newCust.setName(request.getCustomerName() != null ? request.getCustomerName() : "Guest");
                newCust.setPhoneNumber(request.getCustomerPhone());
                return customerRepository.save(newCust);
            });
            order.setCustomer(customer);
        }

        // Build order items
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal tax = BigDecimal.ZERO;

        for (var itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found: " + itemReq.getProductId()));

            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setProduct(product);
            item.setQuantity(itemReq.getQuantity());
            item.setUnitPrice(product.getPrice());

            BigDecimal lineTotal = product.getPrice().multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            item.setLineTotal(lineTotal);
            item.setKitchenStatus(KitchenStatus.TO_COOK);

            order.getItems().add(item);
            subtotal = subtotal.add(lineTotal);

            // Apply tax percent if product has one (taxPercent is stored as e.g. 5.00 for 5%)
            if (product.getTaxPercent() != null) {
                tax = tax.add(lineTotal.multiply(product.getTaxPercent().divide(BigDecimal.valueOf(100))));
            }
        }

        BigDecimal discount = request.getDiscountAmount() != null ? request.getDiscountAmount() : BigDecimal.ZERO;
        
        // Ensure discount doesn't exceed subtotal
        if (discount.compareTo(subtotal) > 0) {
            discount = subtotal;
        }

        order.setSubtotal(subtotal);
        order.setTaxAmount(tax);
        order.setDiscountAmount(discount);
        order.setTotalAmount(subtotal.add(tax).subtract(discount).max(BigDecimal.ZERO));

        // Determine initial status
        boolean hasPayment = request.getPaymentMethod() != null && !request.getPaymentMethod().isBlank() && !request.getPaymentMethod().equals("unpaid");

        if (request.isSendToKitchen()) {
            order.setStatus(hasPayment ? OrderStatus.PAID : OrderStatus.PENDING);
            order.setKitchenStatus(KitchenStatus.TO_COOK);
            order.setSentToKitchenAt(LocalDateTime.now());
        } else if (hasPayment) {
            order.setStatus(OrderStatus.PAID);
            order.setKitchenStatus(KitchenStatus.TO_COOK);
        } else {
            order.setStatus(OrderStatus.DRAFT);
        }

        PosOrder saved = orderRepository.save(order);
        OrderDto dto = OrderDto.from(saved);

        // Broadcast to KDS WebSocket if requested
        if (request.isSendToKitchen()) {
            try {
                kdsWebSocketHandler.broadcastUpdate(java.util.Map.of(
                    "type", "NEW_ORDER",
                    "payload", dto
                ));
            } catch (Exception e) {
                System.err.println("Failed to broadcast KDS update: " + e.getMessage());
            }
        }

        // Send email if paid immediately (non-blocking try-catch)
        try {
            if (saved.getStatus() == OrderStatus.PAID && saved.getCustomer() != null && saved.getCustomer().getEmail() != null) {
                String htmlReceipt = receiptService.generateReceiptHtml(dto);
                emailService.sendReceiptEmail(saved.getCustomer().getEmail(), saved.getCustomer().getName(), saved.getOrderNumber(), htmlReceipt);
            }
        } catch (Exception e) {
            System.err.println("Failed to send receipt email: " + e.getMessage());
        }

        return dto;
    }

    @Transactional
    public OrderDto createPublicOrder(OrderCreateRequest request) {
        PosSession session = sessionRepository.findByStatus(SessionStatus.OPEN).stream().findFirst().orElse(null);

        PosOrder order = new PosOrder();
        order.setEmployee(null);
        order.setSession(session);
        order.setOrderType("dine-in"); // Public orders are usually dine-in
        order.setNotes(request.getNotes());
        order.setOrderDate(LocalDateTime.now());
        order.setSelfOrdered(true);

        // Assign a default employee to bypass NOT NULL constraint (e.g., system admin)
        AppUser defaultEmployee = appUserRepository.findByEmail("admin@cafe.com")
            .orElseGet(() -> appUserRepository.findAll().stream().findFirst().orElse(null));
        order.setEmployee(defaultEmployee);

        // Generate order number
        String orderNumber = "ORD-PUB-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss"));
        order.setOrderNumber(orderNumber);

        // Link table if provided
        if (request.getTableId() != null) {
            RestaurantTable table = tableRepository.findById(request.getTableId()).orElse(null);
            order.setTable(table);
        }

        // Link customer if provided by ID
        if (request.getCustomerId() != null) {
            Customer customer = customerRepository.findById(request.getCustomerId()).orElse(null);
            order.setCustomer(customer);
        } else if (request.getCustomerEmail() != null && !request.getCustomerEmail().isBlank()) {
            // Find or create customer by email
            Customer customer = customerRepository.findByEmail(request.getCustomerEmail()).orElseGet(() -> {
                Customer newCust = new Customer();
                newCust.setEmail(request.getCustomerEmail());
                newCust.setName(request.getCustomerName() != null ? request.getCustomerName() : "Guest");
                newCust.setPhoneNumber(request.getCustomerPhone());
                return customerRepository.save(newCust);
            });
            order.setCustomer(customer);
        }

        // Build order items
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal tax = BigDecimal.ZERO;

        for (var itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found: " + itemReq.getProductId()));

            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setProduct(product);
            item.setQuantity(itemReq.getQuantity());
            item.setUnitPrice(product.getPrice());

            BigDecimal lineTotal = product.getPrice().multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            item.setLineTotal(lineTotal);
            item.setKitchenStatus(KitchenStatus.TO_COOK);

            order.getItems().add(item);
            subtotal = subtotal.add(lineTotal);

            // Apply tax percent if product has one
            if (product.getTaxPercent() != null) {
                tax = tax.add(lineTotal.multiply(product.getTaxPercent().divide(BigDecimal.valueOf(100))));
            }
        }

        order.setSubtotal(subtotal);
        order.setTaxAmount(tax);
        order.setDiscountAmount(BigDecimal.ZERO);
        order.setTotalAmount(subtotal.add(tax));

        if (request.getPaymentMethod() != null && !request.getPaymentMethod().isBlank()) {
            order.setStatus(OrderStatus.PAID);
            order.setKitchenStatus(KitchenStatus.TO_COOK);
            order.setSentToKitchenAt(LocalDateTime.now());
        } else {
            // Fallback (though frontend now forces payment)
            order.setStatus(OrderStatus.PENDING);
            order.setKitchenStatus(KitchenStatus.TO_COOK);
            order.setSentToKitchenAt(LocalDateTime.now());
        }

        PosOrder saved = orderRepository.save(order);
        OrderDto dto = OrderDto.from(saved);

        // Broadcast to KDS WebSocket FIRST - this is critical for kitchen display
        try {
            kdsWebSocketHandler.broadcastUpdate(java.util.Map.of(
                "type", "NEW_ORDER",
                "payload", dto
            ));
        } catch (Exception e) {
            // Log but don't fail the order
            System.err.println("Failed to broadcast to KDS WebSocket: " + e.getMessage());
        }

        // Send email if paid immediately (non-critical, don't block the order)
        try {
            if (saved.getStatus() == OrderStatus.PAID && saved.getCustomer() != null && saved.getCustomer().getEmail() != null) {
                String htmlReceipt = receiptService.generateReceiptHtml(dto);
                emailService.sendReceiptEmail(saved.getCustomer().getEmail(), saved.getCustomer().getName(), saved.getOrderNumber(), htmlReceipt);
            }
        } catch (Exception e) {
            System.err.println("Failed to send receipt email: " + e.getMessage());
        }

        return dto;
    }

    @Transactional
    public OrderDto appendItemsToOrder(Long orderId, OrderCreateRequest request) {
        PosOrder order = orderRepository.findById(orderId)
            .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

        BigDecimal addedSubtotal = BigDecimal.ZERO;
        BigDecimal addedTax = BigDecimal.ZERO;

        for (var itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found: " + itemReq.getProductId()));

            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setProduct(product);
            item.setQuantity(itemReq.getQuantity());
            item.setUnitPrice(product.getPrice());

            BigDecimal lineTotal = product.getPrice().multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            item.setLineTotal(lineTotal);
            item.setKitchenStatus(KitchenStatus.TO_COOK);

            order.getItems().add(item);
            addedSubtotal = addedSubtotal.add(lineTotal);

            if (product.getTaxPercent() != null) {
                addedTax = addedTax.add(lineTotal.multiply(product.getTaxPercent().divide(BigDecimal.valueOf(100))));
            }
        }

        order.setSubtotal(order.getSubtotal().add(addedSubtotal));
        order.setTaxAmount(order.getTaxAmount().add(addedTax));
        order.setTotalAmount(order.getTotalAmount().add(addedSubtotal).add(addedTax));

        // If it was already completed/ready, adding items resets kitchen status to PREPARING or TO_COOK
        if (order.getKitchenStatus() == KitchenStatus.COMPLETED) {
            order.setKitchenStatus(KitchenStatus.PREPARING);
        }
        if (order.getStatus() == OrderStatus.READY) {
            order.setStatus(OrderStatus.PREPARING);
        }

        PosOrder saved = orderRepository.save(order);
        OrderDto dto = OrderDto.from(saved);
        kdsWebSocketHandler.broadcastUpdate(java.util.Map.of(
            "type", "UPDATE_ORDER",
            "payload", dto
        ));
        return dto;
    }

    @Transactional(readOnly = true)
    public List<OrderDto> getAllOrders() {
        return orderRepository.findAllByOrderByOrderDateDesc().stream()
            .map(OrderDto::from)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OrderDto> getOrdersBySession(Long sessionId) {
        PosSession session = sessionRepository.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Session not found: " + sessionId));
        return orderRepository.findBySessionOrderByOrderDateDesc(session).stream()
            .map(OrderDto::from)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public OrderDto getOrderById(Long id) {
        return OrderDto.from(orderRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Order not found: " + id)));
    }

    @Transactional
    public OrderDto updateOrderStatus(Long id, String status) {
        PosOrder order = orderRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Order not found: " + id));
        
        OrderStatus newStatus = OrderStatus.valueOf(status.toUpperCase());
        order.setStatus(newStatus);
        
        PosOrder saved = orderRepository.save(order);
        OrderDto dto = OrderDto.from(saved);

        if (newStatus == OrderStatus.PAID && saved.getCustomer() != null && saved.getCustomer().getEmail() != null) {
            String htmlReceipt = receiptService.generateReceiptHtml(dto);
            emailService.sendReceiptEmail(saved.getCustomer().getEmail(), saved.getCustomer().getName(), saved.getOrderNumber(), htmlReceipt);
        }

        return dto;
    }

    @Transactional(readOnly = true)
    public List<OrderDto> getOrdersByTableAndEmail(Long tableId, String email) {
        return orderRepository.findByTableIdOrderByOrderDateDesc(tableId).stream()
            .filter(o -> o.getCustomer() != null && email.equalsIgnoreCase(o.getCustomer().getEmail()))
            .map(OrderDto::from)
            .collect(Collectors.toList());
    }
}
