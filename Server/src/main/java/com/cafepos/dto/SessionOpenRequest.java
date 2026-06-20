package com.cafepos.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class SessionOpenRequest {
    private BigDecimal openingCashAmount = BigDecimal.ZERO;
}
