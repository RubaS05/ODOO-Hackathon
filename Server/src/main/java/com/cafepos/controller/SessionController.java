package com.cafepos.controller;

import com.cafepos.dto.SessionDto;
import com.cafepos.dto.SessionOpenRequest;
import com.cafepos.entity.AppUser;
import com.cafepos.security.CustomUserDetails;
import com.cafepos.service.SessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class SessionController {

    private final SessionService sessionService;

    /** Get the current open session (or last session) for the logged-in user */
    @GetMapping("/current")
    public ResponseEntity<SessionDto> getCurrentSession(Authentication auth) {
        AppUser user = getUser(auth);
        SessionDto dto = sessionService.getCurrentSessionDto(user);
        if (dto == null) return ResponseEntity.noContent().build();
        return ResponseEntity.ok(dto);
    }

    /** Open a new POS session */
    @PostMapping("/open")
    public ResponseEntity<SessionDto> openSession(
            @RequestBody(required = false) SessionOpenRequest request,
            Authentication auth) {
        AppUser user = getUser(auth);
        if (request == null) request = new SessionOpenRequest();
        SessionDto dto = sessionService.openSession(user, request);
        return ResponseEntity.ok(dto);
    }

    /** Close the current open session */
    @PostMapping("/close")
    public ResponseEntity<SessionDto> closeSession(Authentication auth) {
        AppUser user = getUser(auth);
        SessionDto dto = sessionService.closeSession(user);
        return ResponseEntity.ok(dto);
    }

    /** Admin: list all sessions */
    @GetMapping
    public ResponseEntity<List<SessionDto>> getAllSessions() {
        return ResponseEntity.ok(sessionService.getAllSessions());
    }

    private AppUser getUser(Authentication auth) {
        return ((CustomUserDetails) auth.getPrincipal()).getAppUser();
    }
}
