package com.cafepos.service;

import com.cafepos.dto.SessionDto;
import com.cafepos.dto.SessionOpenRequest;
import com.cafepos.entity.AppUser;
import com.cafepos.entity.PosSession;
import com.cafepos.enums.SessionStatus;
import com.cafepos.repository.PosOrderRepository;
import com.cafepos.repository.PosSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SessionService {

    private final PosSessionRepository sessionRepository;
    private final PosOrderRepository orderRepository;

    public Optional<PosSession> getCurrentOpenSession() {
        return sessionRepository.findByStatus(SessionStatus.OPEN).stream().findFirst();
    }

    public SessionDto getCurrentSessionDto(AppUser user) {
        Optional<PosSession> open = getCurrentOpenSession();
        if (open.isPresent()) {
            PosSession s = open.get();
            int orderCount = orderRepository.findBySessionOrderByOrderDateDesc(s).size();
            return SessionDto.from(s, orderCount);
        }
        // Return last closed session info
        Optional<PosSession> last = sessionRepository.findFirstByOrderByOpenedAtDesc();
        return last.map(s -> SessionDto.from(s, orderRepository.findBySessionOrderByOrderDateDesc(s).size()))
                   .orElse(null);
    }

    @Transactional
    public SessionDto openSession(AppUser user, SessionOpenRequest request) {
        // Check if already has open session
        Optional<PosSession> existing = getCurrentOpenSession();
        if (existing.isPresent()) {
            int count = orderRepository.findBySessionOrderByOrderDateDesc(existing.get()).size();
            return SessionDto.from(existing.get(), count);
        }

        PosSession session = new PosSession();
        session.setEmployee(user);
        session.setStatus(SessionStatus.OPEN);
        session.setOpenedAt(LocalDateTime.now());
        session.setOpeningCashAmount(
            request.getOpeningCashAmount() != null ? request.getOpeningCashAmount() : BigDecimal.ZERO
        );
        PosSession saved = sessionRepository.save(session);
        return SessionDto.from(saved, 0);
    }

    @Transactional
    public SessionDto closeSession(AppUser user) {
        PosSession session = getCurrentOpenSession()
            .orElseThrow(() -> new RuntimeException("No open session found"));

        BigDecimal totalSales = orderRepository.sumTotalBySession(session);
        int orderCount = orderRepository.findBySessionOrderByOrderDateDesc(session).size();

        session.setStatus(SessionStatus.CLOSED);
        session.setClosedAt(LocalDateTime.now());
        session.setClosingSaleAmount(totalSales != null ? totalSales : BigDecimal.ZERO);

        PosSession saved = sessionRepository.save(session);
        return SessionDto.from(saved, orderCount);
    }

    public List<SessionDto> getAllSessions() {
        return sessionRepository.findAllByOrderByOpenedAtDesc().stream()
            .map(s -> SessionDto.from(s, orderRepository.findBySessionOrderByOrderDateDesc(s).size()))
            .collect(Collectors.toList());
    }

    public PosSession getSessionById(Long id) {
        return sessionRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Session not found: " + id));
    }
}
