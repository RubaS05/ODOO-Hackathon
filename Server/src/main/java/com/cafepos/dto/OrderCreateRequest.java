package com.cafepos.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class OrderCreateRequest {
    private Long sessionId;
    private Long tableId;
    private Long customerId;
    private String orderType;    // dine-in, takeaway, delivery
    private String notes;
    private String couponCode;
    private List<OrderItemRequest> items;
    // Payment details (if completing payment immediately)
    private String paymentMethod;         // cash, card, upi
    private BigDecimal amountReceived;    // for cash
    private String transactionReference;  // for card
    private boolean sendToKitchen = false;
}
