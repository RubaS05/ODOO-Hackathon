package com.cafepos.entity;

import com.cafepos.enums.Role;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * Represents both the Admin (User) and Employee (Cashier) accounts.
 * Section 2.1 Login & Signup, 2.7 User/Employee Management
 */
@Entity
@Table(name = "app_user")
@Data
public class AppUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password; // store as BCrypt hash

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role; // ADMIN or EMPLOYEE

    @Column(nullable = false)
    private boolean archived = false;

    private LocalDateTime createdAt = LocalDateTime.now();
}
