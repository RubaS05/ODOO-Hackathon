package com.cafepos.entity;

import com.cafepos.enums.SelfOrderMode;
import jakarta.persistence.*;
import lombok.Data;

/**
 * Section 2.10 Self Ordering - single-row configuration table.
 */
@Entity
@Table(name = "self_order_config")
@Data
public class SelfOrderConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private boolean enabled = false;

    @Enumerated(EnumType.STRING)
    private SelfOrderMode mode; // ONLINE_ORDERING or QR_MENU

    private String backgroundColor;

    private String backgroundImageUrl;
}
