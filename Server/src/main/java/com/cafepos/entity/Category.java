package com.cafepos.entity;

import jakarta.persistence.*;
import lombok.Data;

/**
 * Section 2.3 Product Category Management
 * Color reflects everywhere category is shown (POS cards, tabs, order view).
 */
@Entity
@Table(name = "category")
@Data
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false)
    private String color; // hex code e.g. #FF5733

    @Column(nullable = false)
    private boolean kitchenDisplay = true; // whether products under this category route to KDS
}
