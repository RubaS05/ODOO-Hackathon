package com.cafepos.entity;

import com.cafepos.enums.DiscountType;
import com.cafepos.enums.PromotionAppliesTo;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

/**
 * Section 2.6 Coupons & Promotions -> Automated Promotions
 * Triggers automatically without code entry.
 */
@Entity
@Table(name = "promotion")
@Data
public class Promotion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PromotionAppliesTo appliesTo; // PRODUCT or ORDER

    // Required when appliesTo = PRODUCT
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    // Required when appliesTo = PRODUCT
    private Integer minQuantity;

    // Required when appliesTo = ORDER
    @Column(precision = 10, scale = 2)
    private BigDecimal minOrderAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DiscountType discountType; // PERCENTAGE or FIXED_AMOUNT

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal discountValue;

    @Column(nullable = false)
    private boolean active = true;
}
