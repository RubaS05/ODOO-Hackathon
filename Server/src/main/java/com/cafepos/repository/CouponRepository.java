package com.cafepos.repository;

import com.cafepos.entity.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CouponRepository extends JpaRepository<Coupon, Long> {
    Coupon findByCodeIgnoreCase(String code);
}
