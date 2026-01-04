package com.alethiq.backend.service;

import com.alethiq.backend.dto.AuthDTO;
import com.alethiq.backend.entity.User;
import com.alethiq.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.alethiq.backend.config.JwtUtil;

@Service
public class AuthService {
    @Autowired
    private JwtUtil jwtUtil; // Inject the printer

    // THE LOGIN LOGIC
    public String login(AuthDTO.LoginRequest request) {
        // 1. Find User by Username OR Email
        // We check username first, if not found, we check email
        User user = userRepository.findByUsername(request.username())
                .orElseGet(() -> userRepository.findByEmail(request.username())
                        .orElseThrow(() -> new RuntimeException("User not found with identifier: " + request.username())));

        // 2. Check Password
        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials!");
        }

        // 3. Generate Token (Use the username from the DB to keep token consistent)
        return jwtUtil.generateToken(user.getUsername());
    }
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // Change return type from User to String
    public String registerUser(AuthDTO.RegisterRequest request) {
        // 1. Check if user already exists
        if (userRepository.existsByUsername(request.username())) {
            throw new RuntimeException("Username is already taken!");
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new RuntimeException("Email is already in use!");
        }

        // 2. Create the User Entity
        User user = User.builder()
                .username(request.username())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .role("USER")
                .build();

        // 3. Save to Postgres
        userRepository.save(user);

        // 4. 🟢 GENERATE & RETURN TOKEN IMMEDIATELY
        return jwtUtil.generateToken(user.getUsername());
    }
    // Add this method inside your AuthService class
    public AuthDTO.UserResponse getUserDetails(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Return a DTO so we don't expose the encrypted password to the frontend
        return new AuthDTO.UserResponse(user.getUsername(), user.getEmail());
    }

}