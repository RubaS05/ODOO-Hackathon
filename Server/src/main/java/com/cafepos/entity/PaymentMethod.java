package com.cafepos.entity;

import com.cafepos.enums.PaymentType;
import jakarta.persistence.*;
import lombok.Data;

/**
 * Section 2.4 Payment Method Setup
 */
@Entity
@Table(name = "payment_method")
@Data
public class PaymentMethod {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true)
    private PaymentType type; // CASH, CARD_DIGITAL, UPI_QR

    @Column(nullable = false)
    private boolean enabled = false;

    // Only relevant when type = UPI_QR
    private String upiId; // e.g. cafe@ybl
}
