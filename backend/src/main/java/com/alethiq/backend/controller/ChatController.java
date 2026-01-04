package com.alethiq.backend.controller;
import org.springframework.security.core.Authentication;
import com.alethiq.backend.dto.ChatDTO;
import com.alethiq.backend.entity.Chat;
import com.alethiq.backend.service.ChatService;
import com.alethiq.backend.service.AiStreamService; // Import the new service
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "http://localhost:3000")
public class ChatController {

    @Autowired
    private ChatService chatService;

    @Autowired
    private AiStreamService aiStreamService;

    // --- CRUD ENDPOINTS ---

    @PostMapping("/new")
    public ResponseEntity<Chat> startChat(@Valid @RequestBody ChatDTO.NewChatRequest request) {
        return ResponseEntity.ok(chatService.createChat(request));
    }

    @PostMapping("/{chatId}/send")
    public ResponseEntity<Chat> sendMessage(@Valid @PathVariable String chatId, @RequestBody String content) {
        return ResponseEntity.ok(chatService.addMessage(chatId.trim(), content));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Chat>> getUserChats(@PathVariable String userId) {
        return ResponseEntity.ok(chatService.getUserChats(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Chat> getChat(@PathVariable String id) {
        return ResponseEntity.ok(chatService.getChatById(id));
    }

    // --- STREAMING ENDPOINT ---

    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> streamChat(@RequestBody ChatDTO.StreamRequest request, Principal principal) {

        // 1. Safe User Check (Fixes the crash)
        // If principal is null (logged out), we use "Anonymous"
        String username = (principal != null) ? principal.getName() : "Anonymous";

        // 2. Extract Query safely from the DTO
        String query = request.query();

        System.out.println("🔹 Request from: " + username + " | Query: " + query);

        // 3. Call Service
        return aiStreamService.streamAnswer(query, username, "fast");
    }
}