package com.cafepos.service;

import com.cafepos.dto.OrderDto;
import com.cafepos.entity.OrderItem;
import com.cafepos.entity.PosOrder;
import com.cafepos.enums.KitchenStatus;
import com.cafepos.enums.OrderStatus;
import com.cafepos.repository.OrderItemRepository;
import com.cafepos.repository.PosOrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cafepos.entity.AppUser;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class KitchenService {

    private final PosOrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final com.cafepos.websocket.KdsWebSocketHandler kdsWebSocketHandler;

    /**
     * Returns all active kitchen orders: those not yet PAID or CANCELLED.
     * Status must be PENDING, PREPARING, or READY.
     */
    @Transactional(readOnly = true)
    public List<OrderDto> getKitchenOrders() {
        List<KitchenStatus> activeStatuses = Arrays.asList(
            KitchenStatus.TO_COOK, KitchenStatus.PREPARING, KitchenStatus.COMPLETED
        );
        return orderRepository.findByKitchenStatusInOrderByOrderDateAsc(activeStatuses).stream()
            .filter(o -> o.getStatus() != OrderStatus.PAID && o.getStatus() != OrderStatus.CANCELLED)
            .map(OrderDto::from)
            .collect(Collectors.toList());
    }

    /**
     * Update kitchen status for a specific order item.
     */
    @Transactional
    public OrderDto updateItemKitchenStatus(Long itemId, String kitchenStatus) {
        OrderItem item = orderItemRepository.findById(itemId)
            .orElseThrow(() -> new RuntimeException("Order item not found: " + itemId));

        item.setKitchenStatus(KitchenStatus.valueOf(kitchenStatus.toUpperCase()));
        orderItemRepository.save(item);

        // Recalculate parent order kitchen status
        PosOrder order = item.getOrder();
        boolean allCompleted = order.getItems().stream()
            .allMatch(i -> i.getKitchenStatus() == KitchenStatus.COMPLETED);
        boolean anyPreparing = order.getItems().stream()
            .anyMatch(i -> i.getKitchenStatus() == KitchenStatus.PREPARING);

        if (allCompleted) {
            order.setKitchenStatus(KitchenStatus.COMPLETED);
            if (order.getStatus() == OrderStatus.PENDING || order.getStatus() == OrderStatus.PREPARING) {
                order.setStatus(OrderStatus.READY);
            }
        } else if (anyPreparing) {
            order.setKitchenStatus(KitchenStatus.PREPARING);
            if (order.getStatus() == OrderStatus.PENDING) {
                order.setStatus(OrderStatus.PREPARING);
            }
        }
        PosOrder saved = orderRepository.save(order);
        OrderDto dto = OrderDto.from(saved);
        kdsWebSocketHandler.broadcastUpdate(java.util.Map.of(
            "type", "UPDATE_ORDER",
            "payload", dto
        ));
        return dto;
    }

    /**
     * Update kitchen status for the whole order at once.
     */
    @Transactional
    public OrderDto updateOrderKitchenStatus(Long orderId, String kitchenStatus, AppUser chef) {
        PosOrder order = orderRepository.findById(orderId)
            .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

        KitchenStatus ks = KitchenStatus.valueOf(kitchenStatus.toUpperCase());
        order.setKitchenStatus(ks);
        
        if (ks == KitchenStatus.PREPARING && chef != null) {
            order.setChef(chef);
        }

        // Update all items to the same status
        order.getItems().forEach(item -> item.setKitchenStatus(ks));

        // Reflect on order status
        if (ks == KitchenStatus.PREPARING) {
            order.setStatus(OrderStatus.PREPARING);
        } else if (ks == KitchenStatus.COMPLETED) {
            order.setStatus(OrderStatus.READY);
        }

        PosOrder saved = orderRepository.save(order);
        OrderDto dto = OrderDto.from(saved);
        kdsWebSocketHandler.broadcastUpdate(java.util.Map.of(
            "type", "UPDATE_ORDER",
            "payload", dto
        ));
        return dto;
    }
}
