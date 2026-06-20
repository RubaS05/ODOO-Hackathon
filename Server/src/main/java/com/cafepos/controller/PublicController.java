package com.cafepos.controller;

import com.cafepos.dto.OrderCreateRequest;
import com.cafepos.dto.OrderDto;
import com.cafepos.entity.Category;
import com.cafepos.entity.Product;
import com.cafepos.service.CategoryService;
import com.cafepos.service.OrderService;
import com.cafepos.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicController {

    private final ProductService productService;
    private final CategoryService categoryService;
    private final OrderService orderService;

    @GetMapping("/products")
    public ResponseEntity<List<Product>> getActiveProducts() {
        return ResponseEntity.ok(productService.getAllProducts());
    }

    @GetMapping("/categories")
    public ResponseEntity<List<Category>> getCategories() {
        return ResponseEntity.ok(categoryService.getAllCategories());
    }

    @PostMapping("/orders")
    public ResponseEntity<OrderDto> createPublicOrder(@RequestBody OrderCreateRequest request) {
        OrderDto dto = orderService.createPublicOrder(request);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/orders/{id}")
    public ResponseEntity<OrderDto> getOrder(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrderById(id));
    }

    @PutMapping("/orders/{id}/append")
    public ResponseEntity<OrderDto> appendToOrder(@PathVariable Long id, @RequestBody OrderCreateRequest request) {
        return ResponseEntity.ok(orderService.appendItemsToOrder(id, request));
    }

    @PutMapping("/orders/{id}/pay")
    public ResponseEntity<OrderDto> payOrder(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.updateOrderStatus(id, "PAID"));
    }
}
