package com.cafepos.dto;

import lombok.Data;

@Data
public class TableRequest {
    private String tableNumber;
    private Integer seats;
    private Long floorId;
}
