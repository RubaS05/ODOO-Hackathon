package com.cafepos.controller;

import com.cafepos.dto.OrderCreateRequest;
import com.cafepos.dto.OrderDto;
import com.cafepos.entity.AppUser;
import com.cafepos.security.CustomUserDetails;
import com.cafepos.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    /** Create a new order */
    @PostMapping
    public ResponseEntity<OrderDto> createOrder(
            @RequestBody OrderCreateRequest request,
            Authentication auth) {
        AppUser employee = getUser(auth);
        OrderDto dto = orderService.createOrder(employee, request);
        return ResponseEntity.ok(dto);
    }

    /** Get all orders (admin) */
    @GetMapping
    public ResponseEntity<List<OrderDto>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    /** Get orders by session */
    @GetMapping("/session/{sessionId}")
    public ResponseEntity<List<OrderDto>> getOrdersBySession(@PathVariable Long sessionId) {
        return ResponseEntity.ok(orderService.getOrdersBySession(sessionId));
    }

    /** Get specific order */
    @GetMapping("/{id}")
    public ResponseEntity<OrderDto> getOrder(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrderById(id));
    }

    /** Update order status */
    @PutMapping("/{id}/status")
    public ResponseEntity<OrderDto> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String status = body.get("status");
        return ResponseEntity.ok(orderService.updateOrderStatus(id, status));
    }

    private AppUser getUser(Authentication auth) {
        return ((CustomUserDetails) auth.getPrincipal()).getAppUser();
    }
}
