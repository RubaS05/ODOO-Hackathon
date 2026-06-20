package com.cafepos.dto;

import lombok.Data;

@Data
public class AdminResetPasswordRequest {
    private String newPassword;
}
