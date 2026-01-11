package com.alethiq.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class ChatDTO {

    public record NewChatRequest(
            @NotBlank(message = "User ID cannot be empty")
            String userId,

            @NotBlank(message = "Message content cannot be empty")
            String content
    ) {}

    public record MessageRequest(
            @NotBlank(message = "Chat ID is required")
            String chatId,

            @NotBlank(message = "Message cannot be empty")
            String content
    ) {}


    public record StreamRequest(
            String query,
            String mode //
    ) {}

    // Inside ChatDTO.java
    public record SaveConversationRequest(
    String username,
    String query,
    String answer
    ) {}

    
}
