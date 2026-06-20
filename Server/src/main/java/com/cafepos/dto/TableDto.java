package com.cafepos.dto;

import com.cafepos.entity.RestaurantTable;
import lombok.Data;

@Data
public class TableDto {
    private Long id;
    private String tableNumber;
    private Integer seats;
    private boolean active;
    private Long floorId;
    private String floorName;
    private String status;
    private Integer occupiedMembers;

    public static TableDto from(RestaurantTable t) {
        TableDto dto = new TableDto();
        dto.setId(t.getId());
        dto.setTableNumber(t.getTableNumber());
        dto.setSeats(t.getSeats());
        dto.setActive(t.isActive());
        if (t.getFloor() != null) {
            dto.setFloorId(t.getFloor().getId());
            dto.setFloorName(t.getFloor().getName());
        }
        dto.setStatus(t.getStatus());
        dto.setOccupiedMembers(t.getOccupiedMembers());
        return dto;
    }
}
