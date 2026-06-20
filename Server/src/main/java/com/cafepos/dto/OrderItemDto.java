package com.cafepos.dto;

import com.cafepos.entity.OrderItem;
import com.cafepos.enums.KitchenStatus;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class OrderItemDto {
    private Long id;
    private Long productId;
    private String productName;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal lineTotal;
    private KitchenStatus kitchenStatus;

    public static OrderItemDto from(OrderItem item) {
        OrderItemDto dto = new OrderItemDto();
        dto.setId(item.getId());
        dto.setProductId(item.getProduct().getId());
        dto.setProductName(item.getProduct().getName());
        dto.setQuantity(item.getQuantity());
        dto.setUnitPrice(item.getUnitPrice());
        dto.setLineTotal(item.getLineTotal());
        dto.setKitchenStatus(item.getKitchenStatus());
        return dto;
    }
}
