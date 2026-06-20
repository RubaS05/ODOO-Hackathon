package com.cafepos.dto;

import lombok.Data;

@Data
public class TableRequest {
    private String tableNumber;
    private Integer seats;
    private String floorName;
    private String status;
    private Integer occupiedMembers;
}
