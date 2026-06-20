package com.cafepos.entity;

import com.cafepos.enums.KitchenStatus;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

/**
 * Line item within a PosOrder. Also tracked individually on the Kitchen Display
 * (Section 4 - clicking an individual item marks only that item completed).
 */
@Entity
@Table(name = "order_item")
@Data
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id")
    private PosOrder order;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id")
    private Product product;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal lineTotal;

    // product-level promotion discount applied to this line, if any
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "promotion_id")
    private Promotion appliedPromotion;

    @Column(precision = 10, scale = 2)
    private BigDecimal lineDiscountAmount = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private KitchenStatus kitchenStatus = KitchenStatus.TO_COOK;
}
