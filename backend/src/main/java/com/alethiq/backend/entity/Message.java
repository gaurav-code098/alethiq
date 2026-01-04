package com.alethiq.backend.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Message {

    private String role;     // "USER" or "AI"
    private String content;  // The actual text
    private LocalDateTime timestamp;
}