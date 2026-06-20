package com.cafepos.entity;

import com.cafepos.enums.SessionStatus;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Section 2.8 POS Terminal & Session
 */
@Entity
@Table(name = "pos_session")
@Data
public class PosSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "employee_id")
    private AppUser employee;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SessionStatus status = SessionStatus.OPEN;

    private LocalDateTime openedAt = LocalDateTime.now();
    private LocalDateTime closedAt;

    @Column(precision = 10, scale = 2)
    private BigDecimal openingCashAmount;

    @Column(precision = 10, scale = 2)
    private BigDecimal closingSaleAmount; // shown as "last closing sale amount"
}
