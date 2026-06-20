package com.cafepos.enums;

public enum OrderStatus {
    DRAFT,
    PENDING,       // Sent to kitchen, awaiting preparation
    PREPARING,     // Kitchen started cooking
    READY,         // Food is ready for serving
    PAID,          // Payment received, order complete
    CANCELLED
}
