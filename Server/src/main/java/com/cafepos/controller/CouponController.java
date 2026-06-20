package com.cafepos.controller;

import com.cafepos.entity.Coupon;
import com.cafepos.repository.CouponRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/coupons")
public class CouponController {

    @Autowired
    private CouponRepository couponRepository;

    @GetMapping
    public List<Coupon> getAllCoupons() {
        return couponRepository.findAll();
    }

    @PostMapping
    public Coupon createCoupon(@RequestBody Coupon coupon) {
        return couponRepository.save(coupon);
    }

    @PutMapping("/{id}/toggle")
    public ResponseEntity<Coupon> toggleCouponStatus(@PathVariable Long id) {
        Optional<Coupon> opt = couponRepository.findById(id);
        if (opt.isPresent()) {
            Coupon coupon = opt.get();
            coupon.setActive(!coupon.isActive());
            couponRepository.save(coupon);
            return ResponseEntity.ok(coupon);
        }
        return ResponseEntity.notFound().build();
    }
}
