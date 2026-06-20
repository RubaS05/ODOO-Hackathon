package com.cafepos.controller;

import com.cafepos.dto.AdminResetPasswordRequest;
import com.cafepos.dto.CreateUserRequest;
import com.cafepos.dto.UserDto;
import com.cafepos.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /** List all users/employees */
    @GetMapping
    public ResponseEntity<List<UserDto>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    /** Create a new employee */
    @PostMapping
    public ResponseEntity<UserDto> createUser(@RequestBody CreateUserRequest request) {
        return ResponseEntity.ok(userService.createUser(request));
    }

    /** Archive or restore a user */
    @PutMapping("/{id}/archive")
    public ResponseEntity<UserDto> toggleArchive(@PathVariable Long id) {
        return ResponseEntity.ok(userService.toggleArchive(id));
    }

    /** Delete a user */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    /** Admin resets any user's password */
    @PutMapping("/{id}/password")
    public ResponseEntity<Void> resetPassword(
            @PathVariable Long id,
            @RequestBody AdminResetPasswordRequest request) {
        userService.resetPassword(id, request.getNewPassword());
        return ResponseEntity.ok().build();
    }
}
