package com.cafepos.controller;

import com.cafepos.dto.OrderCreateRequest;
import com.cafepos.dto.OrderDto;
import com.cafepos.entity.Category;
import com.cafepos.entity.Product;
import com.cafepos.service.CategoryService;
import com.cafepos.service.OrderService;
import com.cafepos.service.ProductService;
import com.cafepos.dto.TableDto;
import com.cafepos.service.TableService;
import com.cafepos.dto.CustomerDto;
import com.cafepos.repository.CustomerRepository;
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
    private final TableService tableService;
    private final CustomerRepository customerRepository;

    @GetMapping("/products")
    public ResponseEntity<List<Product>> getActiveProducts() {
        return ResponseEntity.ok(productService.getAllProducts());
    }

    @GetMapping("/categories")
    public ResponseEntity<List<Category>> getCategories() {
        return ResponseEntity.ok(categoryService.getAllCategories());
    }

    @GetMapping("/tables/{id}")
    public ResponseEntity<TableDto> getTable(@PathVariable Long id) {
        return ResponseEntity.ok(tableService.getTableById(id));
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

    @GetMapping("/tables/{tableId}/orders")
    public ResponseEntity<List<OrderDto>> getTableOrders(
            @PathVariable Long tableId,
            @RequestParam String email) {
        return ResponseEntity.ok(orderService.getOrdersByTableAndEmail(tableId, email));
    }
}
