package com.cafepos.entity;

import com.cafepos.enums.KitchenStatus;
import com.cafepos.enums.OrderStatus;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Section 3.3 Order View / 3.6 Orders
 * Renamed from "Order" to avoid clash with SQL reserved keyword.
 */
@Entity
@Table(name = "pos_order")
@Data
public class PosOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String orderNumber;

    @Column(nullable = false)
    private LocalDateTime orderDate = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @ManyToOne(optional = true)
    @JoinColumn(name = "employee_id")
    private AppUser employee;

    @ManyToOne(optional = true)
    @JoinColumn(name = "session_id")
    private PosSession session;

    @ManyToOne
    @JoinColumn(name = "chef_id")
    private AppUser chef;

    @ManyToOne
    @JoinColumn(name = "table_id")
    private RestaurantTable table;

    // dine-in, takeaway, delivery
    @Column(nullable = false)
    private String orderType = "dine-in";

    @Enumerated(EnumType.STRING)
    @Column(name = "order_status", nullable = false, columnDefinition = "VARCHAR(50)")
    private OrderStatus status = OrderStatus.DRAFT;

    @Enumerated(EnumType.STRING)
    @Column(name = "kitchen_order_status", nullable = false, columnDefinition = "VARCHAR(50)")
    private KitchenStatus kitchenStatus = KitchenStatus.TO_COOK;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    // Order-level discount applied (coupon code or automated order promotion)
    @ManyToOne
    @JoinColumn(name = "coupon_id")
    private Coupon coupon;

    @ManyToOne
    @JoinColumn(name = "promotion_id")
    private Promotion orderPromotion;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    private String notes;

    // true if order originated from Self Ordering (Section 2.10) rather than POS terminal
    @Column(nullable = false)
    private boolean selfOrdered = false;

    private LocalDateTime sentToKitchenAt;
}
