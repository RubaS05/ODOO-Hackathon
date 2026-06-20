package com.cafepos.dto;

import com.cafepos.entity.PosOrder;
import com.cafepos.enums.KitchenStatus;
import com.cafepos.enums.OrderStatus;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
public class OrderDto {
    private Long id;
    private String orderNumber;
    private LocalDateTime orderDate;
    private String orderType;
    private OrderStatus status;
    private KitchenStatus kitchenStatus;
    private String customerName;
    private Long customerId;
    private String tableNumber;
    private Long tableId;
    private String employeeName;
    private Long sessionId;
    private BigDecimal subtotal;
    private BigDecimal taxAmount;
    private BigDecimal discountAmount;
    private BigDecimal totalAmount;
    private String notes;
    private String chefName;
    private List<OrderItemDto> items;

    public static OrderDto from(PosOrder o) {
        OrderDto dto = new OrderDto();
        dto.setId(o.getId());
        dto.setOrderNumber(o.getOrderNumber());
        dto.setOrderDate(o.getOrderDate());
        dto.setOrderType(o.getOrderType());
        dto.setStatus(o.getStatus());
        dto.setKitchenStatus(o.getKitchenStatus());
        dto.setEmployeeName(o.getEmployee().getName());
        dto.setSessionId(o.getSession().getId());
        dto.setSubtotal(o.getSubtotal());
        dto.setTaxAmount(o.getTaxAmount());
        dto.setDiscountAmount(o.getDiscountAmount());
        dto.setTotalAmount(o.getTotalAmount());
        dto.setNotes(o.getNotes());
        if (o.getChef() != null) {
            dto.setChefName(o.getChef().getName());
        }
        if (o.getCustomer() != null) {
            dto.setCustomerName(o.getCustomer().getName());
            dto.setCustomerId(o.getCustomer().getId());
        }
        if (o.getTable() != null) {
            dto.setTableNumber(o.getTable().getTableNumber());
            dto.setTableId(o.getTable().getId());
        }
        dto.setItems(o.getItems().stream().map(OrderItemDto::from).collect(Collectors.toList()));
        return dto;
    }
}
