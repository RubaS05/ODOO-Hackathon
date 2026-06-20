package com.cafepos.controller;

import com.cafepos.dto.OrderDto;
import com.cafepos.service.KitchenService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

import com.cafepos.security.CustomUserDetails;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

@RestController
@RequestMapping("/api/kitchen")
@RequiredArgsConstructor
public class KitchenController {

    private final KitchenService kitchenService;

    /** Get all active kitchen orders (TO_COOK, PREPARING) */
    @GetMapping("/orders")
    public ResponseEntity<List<OrderDto>> getKitchenOrders() {
        return ResponseEntity.ok(kitchenService.getKitchenOrders());
    }

    /** Update kitchen status for a specific order item */
    @PutMapping("/items/{itemId}/status")
    public ResponseEntity<OrderDto> updateItemStatus(
            @PathVariable Long itemId,
            @RequestBody Map<String, String> body) {
        String status = body.get("kitchenStatus");
        return ResponseEntity.ok(kitchenService.updateItemKitchenStatus(itemId, status));
    }

    /** Update kitchen status for an entire order */
    @PutMapping("/orders/{orderId}/status")
    public ResponseEntity<OrderDto> updateOrderStatus(
            @PathVariable Long orderId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        String status = body.get("kitchenStatus");
        return ResponseEntity.ok(kitchenService.updateOrderKitchenStatus(orderId, status, userDetails != null ? userDetails.getAppUser() : null));
    }
}
