package com.cafepos.controller;

import com.cafepos.dto.AuthResponse;
import com.cafepos.dto.LoginRequest;
import com.cafepos.dto.SignupRequest;
import com.cafepos.entity.AppUser;
import com.cafepos.enums.Role;
import com.cafepos.repository.AppUserRepository;
import com.cafepos.dto.ChangePasswordRequest;
import com.cafepos.security.CustomUserDetails;
import com.cafepos.security.JwtUtil;
import com.cafepos.service.EmailService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@Valid @RequestBody SignupRequest request) {
        if (appUserRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Email is already taken!");
        }

        AppUser user = new AppUser();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        // Assigning ADMIN role as default for self-signup
        user.setRole(Role.ADMIN);

        AppUser savedUser = appUserRepository.save(user);

        emailService.sendWelcomeEmail(savedUser.getEmail(), savedUser.getName());

        return ResponseEntity.ok("User registered successfully");
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        AppUser appUser = userDetails.getAppUser();

        String jwtToken = jwtUtil.generateToken(userDetails);

        AuthResponse response = AuthResponse.builder()
                .token(jwtToken)
                .id(appUser.getId())
                .name(appUser.getName())
                .email(appUser.getEmail())
                .role(appUser.getRole())
                .build();

        return ResponseEntity.ok(response);
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@Valid @RequestBody ChangePasswordRequest request, Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not authenticated");
        }
        
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        AppUser appUser = userDetails.getAppUser();

        if (!passwordEncoder.matches(request.getOldPassword(), appUser.getPassword())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Incorrect old password");
        }

        appUser.setPassword(passwordEncoder.encode(request.getNewPassword()));
        appUserRepository.save(appUser);

        return ResponseEntity.ok("Password changed successfully");
    }
}
