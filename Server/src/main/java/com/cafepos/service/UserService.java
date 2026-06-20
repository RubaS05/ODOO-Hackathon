package com.cafepos.service;

import com.cafepos.dto.CreateUserRequest;
import com.cafepos.dto.UserDto;
import com.cafepos.entity.AppUser;
import com.cafepos.repository.AppUserRepository;
import com.cafepos.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final AppUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
            .map(UserDto::from)
            .collect(Collectors.toList());
    }

    @Transactional
    public UserDto createUser(CreateUserRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists: " + request.getEmail());
        }
        AppUser user = new AppUser();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());
        AppUser saved = userRepository.save(user);
        emailService.sendWelcomeEmail(saved.getEmail(), saved.getName());
        return UserDto.from(saved);
    }

    @Transactional
    public UserDto toggleArchive(Long id) {
        AppUser user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found: " + id));
        user.setArchived(!user.isArchived());
        return UserDto.from(userRepository.save(user));
    }

    @Transactional
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    @Transactional
    public void resetPassword(Long id, String newPassword) {
        AppUser user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found: " + id));
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
}
