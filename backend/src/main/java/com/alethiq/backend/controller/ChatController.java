package com.alethiq.backend.controller;

import org.springframework.security.core.Authentication;
import com.alethiq.backend.dto.ChatDTO;
import com.alethiq.backend.entity.Chat;
import com.alethiq.backend.service.ChatService;
import com.alethiq.backend.service.AiStreamService; 
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
    // Add this anywhere inside the class
    @GetMapping("/version")
    public ResponseEntity<String> checkVersion() {
    System.out.println("✅ Version Check Hit!");
    return ResponseEntity.ok("Alethiq Backend v3.0 - Save Active");
    }

    // 🟢 THIS WAS MISSING! (The "Mailbox" for saving chats)
   // ... inside ChatController ...

    // 🟢 REPLACE THE OLD saveConversation METHOD WITH THIS:
    @PostMapping("/save-conversation")
    public ResponseEntity<?> saveConversation(@RequestBody java.util.Map<String, String> payload, Principal principal) {
        // 1. Check Auth
        if (principal == null) return ResponseEntity.status(403).body("Not logged in");
        
        String username = principal.getName();
        System.out.println("📢 RAW SAVE REQUEST RECEIVED from: " + username);
        System.out.println("📦 Payload: " + payload);

        // 2. Extract Data Manually (Safer than DTO for now)
        String query = payload.get("query");
        String answer = payload.get("answer");

        if (query == null || answer == null) {
             System.out.println("❌ Missing query or answer in payload!");
             return ResponseEntity.badRequest().body("Missing query or answer");
        }

        // 3. Save
        Chat savedChat = chatService.saveFullConversation(username, query, answer);
        System.out.println("✅ SAVED TO DB: " + savedChat.getId());
        
        return ResponseEntity.ok(savedChat);
    }

    // --- STREAMING ENDPOINT ---

    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> streamChat(@RequestBody ChatDTO.StreamRequest request, Principal principal) {
        String username = (principal != null) ? principal.getName() : "Anonymous";
        String query = request.query();
        System.out.println("🔹 Request from: " + username + " | Query: " + query);
        return aiStreamService.streamAnswer(query, username, "fast");
    }
}
