package com.cafepos.repository;

import com.cafepos.entity.Floor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FloorRepository extends JpaRepository<Floor, Long> {
    Optional<Floor> findByName(String name);
}
