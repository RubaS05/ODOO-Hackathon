package com.cafepos.dto;

import com.cafepos.entity.Customer;
import lombok.Data;

@Data
public class CustomerDto {
    private Long id;
    private String name;
    private String email;
    private String phone; // mapped to phoneNumber

    public static CustomerDto from(Customer customer) {
        if (customer == null) return null;
        CustomerDto dto = new CustomerDto();
        dto.setId(customer.getId());
        dto.setName(customer.getName());
        dto.setEmail(customer.getEmail());
        dto.setPhone(customer.getPhoneNumber());
        return dto;
    }
}
