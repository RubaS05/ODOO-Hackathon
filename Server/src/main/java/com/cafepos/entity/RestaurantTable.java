package com.cafepos.entity;

import jakarta.persistence.*;
import lombok.Data;

/**
 * Section 2.5 Floor Plan & Table Management
 * Renamed from "Table" to avoid clash with SQL reserved keyword / javax annotation.
 */
@Entity
@Table(name = "restaurant_table")
@Data
public class RestaurantTable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "floor_id")
    private Floor floor;

    @Column(nullable = false)
    private String tableNumber;

    @Column(nullable = false)
    private Integer seats;

    @Column(nullable = false)
    private boolean active = true;

    // Unique token used for Self Ordering QR (Section 2.10): <domain>/s/<unique-token>
    @Column(unique = true)
    private String qrToken;
}
