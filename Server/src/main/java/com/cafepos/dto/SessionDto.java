package com.cafepos.dto;

import com.cafepos.entity.PosSession;
import com.cafepos.enums.SessionStatus;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class SessionDto {
    private Long id;
    private String employeeName;
    private String employeeEmail;
    private SessionStatus status;
    private LocalDateTime openedAt;
    private LocalDateTime closedAt;
    private BigDecimal openingCashAmount;
    private BigDecimal closingSaleAmount;
    private Integer totalOrders;

    public static SessionDto from(PosSession s, Integer totalOrders) {
        SessionDto dto = new SessionDto();
        dto.setId(s.getId());
        dto.setEmployeeName(s.getEmployee().getName());
        dto.setEmployeeEmail(s.getEmployee().getEmail());
        dto.setStatus(s.getStatus());
        dto.setOpenedAt(s.getOpenedAt());
        dto.setClosedAt(s.getClosedAt());
        dto.setOpeningCashAmount(s.getOpeningCashAmount());
        dto.setClosingSaleAmount(s.getClosingSaleAmount());
        dto.setTotalOrders(totalOrders);
        return dto;
    }
}
