package com.alethiq.backend.controller;

import com.alethiq.backend.dto.AuthDTO;
import com.alethiq.backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<String> register(@Valid @RequestBody AuthDTO.RegisterRequest request) {
        // 🟢 Capture the token returned by the service
        String token = authService.registerUser(request);

        // Return the token so React can log the user in immediately
        return ResponseEntity.ok(token);
    }
    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody AuthDTO.LoginRequest request) {
        String token = authService.login(request);
        return ResponseEntity.ok(token);
    }
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        // Returns the username and email of the logged-in user
        return ResponseEntity.ok(authService.getUserDetails(authentication.getName()));
    }

}