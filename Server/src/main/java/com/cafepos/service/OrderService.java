package com.cafepos.service;

import com.cafepos.dto.OrderCreateRequest;
import com.cafepos.dto.OrderDto;
import com.cafepos.entity.*;
import com.cafepos.enums.KitchenStatus;
import com.cafepos.enums.OrderStatus;
import com.cafepos.enums.SessionStatus;
import com.cafepos.repository.*;
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

        // Link customer if provided
        if (request.getCustomerId() != null) {
            Customer customer = customerRepository.findById(request.getCustomerId()).orElse(null);
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

        order.setSubtotal(subtotal);
        order.setTaxAmount(tax);
        order.setDiscountAmount(BigDecimal.ZERO);
        order.setTotalAmount(subtotal.add(tax));

        // Determine initial status
        if (request.isSendToKitchen()) {
            order.setStatus(OrderStatus.PENDING);
            order.setKitchenStatus(KitchenStatus.TO_COOK);
            order.setSentToKitchenAt(LocalDateTime.now());
        } else if (request.getPaymentMethod() != null && !request.getPaymentMethod().isBlank()) {
            order.setStatus(OrderStatus.PAID);
            order.setKitchenStatus(KitchenStatus.TO_COOK);
        } else {
            order.setStatus(OrderStatus.DRAFT);
        }

        PosOrder saved = orderRepository.save(order);
        return OrderDto.from(saved);
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

        // Generate order number
        String orderNumber = "ORD-PUB-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss"));
        order.setOrderNumber(orderNumber);

        // Link table if provided
        if (request.getTableId() != null) {
            RestaurantTable table = tableRepository.findById(request.getTableId()).orElse(null);
            order.setTable(table);
        }

        // Link customer if provided
        if (request.getCustomerId() != null) {
            Customer customer = customerRepository.findById(request.getCustomerId()).orElse(null);
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

        // Always send to kitchen directly for public orders
        order.setStatus(OrderStatus.PENDING);
        order.setKitchenStatus(KitchenStatus.TO_COOK);
        order.setSentToKitchenAt(LocalDateTime.now());

        PosOrder saved = orderRepository.save(order);
        return OrderDto.from(saved);
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
        return OrderDto.from(saved);
    }

    public List<OrderDto> getAllOrders() {
        return orderRepository.findAllByOrderByOrderDateDesc().stream()
            .map(OrderDto::from)
            .collect(Collectors.toList());
    }

    public List<OrderDto> getOrdersBySession(Long sessionId) {
        PosSession session = sessionRepository.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Session not found: " + sessionId));
        return orderRepository.findBySessionOrderByOrderDateDesc(session).stream()
            .map(OrderDto::from)
            .collect(Collectors.toList());
    }

    public OrderDto getOrderById(Long id) {
        return OrderDto.from(orderRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Order not found: " + id)));
    }

    @Transactional
    public OrderDto updateOrderStatus(Long id, String status) {
        PosOrder order = orderRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Order not found: " + id));
        order.setStatus(OrderStatus.valueOf(status.toUpperCase()));
        return OrderDto.from(orderRepository.save(order));
    }
}
