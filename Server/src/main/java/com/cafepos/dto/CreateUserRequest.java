package com.cafepos.dto;

import com.cafepos.enums.Role;
import lombok.Data;

@Data
public class CreateUserRequest {
    private String name;
    private String email;
    private String password;
    private Role role = Role.EMPLOYEE;
}
