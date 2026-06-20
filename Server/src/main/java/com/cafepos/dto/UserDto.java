package com.cafepos.dto;

import com.cafepos.entity.AppUser;
import com.cafepos.enums.Role;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class UserDto {
    private Long id;
    private String name;
    private String email;
    private Role role;
    private boolean archived;
    private LocalDateTime createdAt;

    public static UserDto from(AppUser u) {
        UserDto dto = new UserDto();
        dto.setId(u.getId());
        dto.setName(u.getName());
        dto.setEmail(u.getEmail());
        dto.setRole(u.getRole());
        dto.setArchived(u.isArchived());
        dto.setCreatedAt(u.getCreatedAt());
        return dto;
    }
}
