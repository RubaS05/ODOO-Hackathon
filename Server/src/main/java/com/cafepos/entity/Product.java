package com.cafepos.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

/**
 * Section 2.2 Product Management
 */
@Entity
@Table(name = "product")
@Data
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @ManyToOne
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    private String unitOfMeasure; // e.g. per piece, per kg, per litre

    @Column(precision = 5, scale = 2)
    private BigDecimal taxPercent; // e.g. 5.00 for 5%

    @Column(length = 1000)
    private String description;

    @Column(nullable = false)
    private boolean active = true;

    // whether this product should appear on the Kitchen Display (Section 4)
    @Column(nullable = false)
    private boolean showOnKds = true;
}
