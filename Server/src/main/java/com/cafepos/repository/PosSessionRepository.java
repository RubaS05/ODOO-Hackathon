package com.cafepos.repository;

import com.cafepos.entity.AppUser;
import com.cafepos.entity.PosSession;
import com.cafepos.enums.SessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PosSessionRepository extends JpaRepository<PosSession, Long> {
    Optional<PosSession> findByEmployeeAndStatus(AppUser employee, SessionStatus status);
    List<PosSession> findByEmployeeOrderByOpenedAtDesc(AppUser employee);
    List<PosSession> findAllByOrderByOpenedAtDesc();
    Optional<PosSession> findFirstByEmployeeOrderByOpenedAtDesc(AppUser employee);
    
    // Global session queries
    List<PosSession> findByStatus(SessionStatus status);
    Optional<PosSession> findFirstByOrderByOpenedAtDesc();
}
