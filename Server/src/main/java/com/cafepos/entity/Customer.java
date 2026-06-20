package com.cafepos.entity;

import jakarta.persistence.*;
import lombok.Data;

/**
 * Section 3.8 Customer Management
 */
@Entity
@Table(name = "customer")
@Data
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String email;

    private String phoneNumber;
}
