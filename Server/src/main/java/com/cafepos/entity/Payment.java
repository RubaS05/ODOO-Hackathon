package com.cafepos.entity;

import com.cafepos.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Section 3.5 Payment & Receipt
 * For Card/Digital + UPI, integrates with Razorpay. CASH is recorded directly.
 */
@Entity
@Table(name = "payment")
@Data
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id")
    private PosOrder order;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "payment_method_id")
    private PaymentMethod paymentMethod;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    // CASH specific
    @Column(precision = 10, scale = 2)
    private BigDecimal amountReceived;

    @Column(precision = 10, scale = 2)
    private BigDecimal changeDue;

    // CARD specific
    private String cardTransactionReference;

    // Razorpay specific (UPI / Card-Digital via Razorpay)
    private String razorpayOrderId;
    private String razorpayPaymentId;
    private String razorpaySignature;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status = PaymentStatus.PENDING;

    private LocalDateTime paidAt;
}
