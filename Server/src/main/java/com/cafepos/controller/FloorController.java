package com.cafepos.controller;

import com.cafepos.entity.Floor;
import com.cafepos.repository.FloorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/floors")
@RequiredArgsConstructor
public class FloorController {

    private final FloorRepository floorRepository;

    @GetMapping
    public ResponseEntity<List<Floor>> getAllFloors() {
        return ResponseEntity.ok(floorRepository.findAll());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Floor> createFloor(@RequestBody Floor floorRequest) {
        if (floorRepository.findByName(floorRequest.getName()).isPresent()) {
            throw new RuntimeException("Floor already exists");
        }
        Floor floor = new Floor();
        floor.setName(floorRequest.getName());
        return ResponseEntity.ok(floorRepository.save(floor));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteFloor(@PathVariable Long id) {
        floorRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
