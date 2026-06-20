package com.cafepos.controller;

import com.cafepos.entity.Promotion;
import com.cafepos.repository.PromotionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/promotions")
public class PromotionController {

    @Autowired
    private PromotionRepository promotionRepository;

    @GetMapping
    public List<Promotion> getAllPromotions() {
        return promotionRepository.findAll();
    }

    @PostMapping
    public Promotion createPromotion(@RequestBody Promotion promotion) {
        return promotionRepository.save(promotion);
    }

    @PutMapping("/{id}/toggle")
    public ResponseEntity<Promotion> togglePromotionStatus(@PathVariable Long id) {
        Optional<Promotion> opt = promotionRepository.findById(id);
        if (opt.isPresent()) {
            Promotion promotion = opt.get();
            promotion.setActive(!promotion.isActive());
            promotionRepository.save(promotion);
            return ResponseEntity.ok(promotion);
        }
        return ResponseEntity.notFound().build();
    }
}
