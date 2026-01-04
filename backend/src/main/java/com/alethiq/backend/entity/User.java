package com.alethiq.backend.entity;

import jakarta.persistence.*; // JPA for Postgres
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users") // Renamed to 'users' because 'user' is a reserved word in SQL
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password; // This will store the Hash, NOT plain text!

    // We will use this later to separate "Admins" from "Users"
    private String role;
}