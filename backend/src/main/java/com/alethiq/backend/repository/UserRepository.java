package com.alethiq.backend.repository;

import com.alethiq.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email); // Add this line
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
}