package com.alethiq.backend.controller;

import com.alethiq.backend.dto.AuthDTO;
import com.alethiq.backend.entity.User; // Import your User entity
import com.alethiq.backend.repository.UserRepository; // Import Repo
import com.alethiq.backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map; // Import Map

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    // 🟢 ADD THIS: We need to talk to the DB to get the ID
    @Autowired
    private UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<String> register(@Valid @RequestBody AuthDTO.RegisterRequest request) {
        String token = authService.registerUser(request);
        return ResponseEntity.ok(token);
    }

    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody AuthDTO.LoginRequest request) {
        String token = authService.login(request);
        return ResponseEntity.ok(token);
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        // 1. Get the username from the security token
        String username = authentication.getName();

        // 2. Fetch the full User from the DB (to get the ID!)
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 3. Return the ID, Username, and Email as a JSON Map
        // This effectively creates: { "id": 1, "username": "...", "email": "..." }
        return ResponseEntity.ok(Map.of(
            "id", user.getId(),
            "username", user.getUsername(),
            "email", user.getEmail()
        ));
    }
}
