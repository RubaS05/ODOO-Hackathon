package com.cafepos.entity;

import com.cafepos.enums.DiscountType;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

/**
 * Section 2.6 Coupons & Promotions -> Coupon Codes
 * Entered manually by employee in POS.
 */
@Entity
@Table(name = "coupon")
@Data
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DiscountType discountType; // PERCENTAGE or FIXED_AMOUNT

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal discountValue;

    @Column(nullable = false)
    private boolean active = true;
}
