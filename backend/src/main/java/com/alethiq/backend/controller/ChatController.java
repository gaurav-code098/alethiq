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
@CrossOrigin(origins = "*") // ✅ Allows Vercel to talk to Render
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

    // 🟢 THIS WAS MISSING! (The "Mailbox" for saving chats)
    @PostMapping("/save-conversation")
    public ResponseEntity<Chat> saveConversation(@RequestBody ChatDTO.SaveConversationRequest request) {
        System.out.println("💾 Saving conversation for: " + request.username());
        
        // Ensure you added 'saveFullConversation' to your ChatService.java!
        Chat savedChat = chatService.saveFullConversation(
            request.username(), 
            request.query(), 
            request.answer()
        );
        
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
