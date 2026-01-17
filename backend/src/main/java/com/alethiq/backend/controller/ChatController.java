package com.alethiq.backend.controller;

import com.alethiq.backend.dto.ChatDTO;
import com.alethiq.backend.entity.Chat;
import com.alethiq.backend.entity.Message;
import com.alethiq.backend.entity.User;
import com.alethiq.backend.repository.ChatRepository;
import com.alethiq.backend.repository.UserRepository;
import com.alethiq.backend.service.AiStreamService;
import com.alethiq.backend.service.ChatService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    @Autowired
    private ChatService chatService;

    @Autowired
    private AiStreamService aiStreamService;

    @Autowired
    private ChatRepository chatRepository;

    @Autowired
    private UserRepository userRepository;

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

    @GetMapping("/version")
    public ResponseEntity<String> checkVersion() {
        return ResponseEntity.ok("Alethiq Backend v3.4 - Threading Clean Build");
    }

   @PostMapping("/save-conversation")
    public ResponseEntity<?> saveConversation(@RequestBody ChatDTO.SaveConversationRequest request, Principal principal) {
        if (principal == null) return ResponseEntity.status(403).body("Not logged in");

        String username = principal.getName();
        
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Chat chat = null;

    
        if (request.conversationId() != null && !request.conversationId().isEmpty()) {
            Optional<Chat> existing = chatRepository.findById(request.conversationId());
            if (existing.isPresent()) {
                Chat foundChat = existing.get();
                // Security Check
                if (foundChat.getUserId().equals(String.valueOf(user.getId()))) {
                    chat = foundChat;
                }
            }
        }

        if (chat == null) {
            chat = new Chat();
            chat.setUserId(String.valueOf(user.getId())); 
            chat.setTitle(request.query()); 
            chat.setCreatedAt(LocalDateTime.now());
            chat.setMessages(new ArrayList<>());
            
            chat = chatRepository.save(chat);
        }

        if (chat.getMessages() == null) {
            chat.setMessages(new ArrayList<>());
        }
        
        chat.getMessages().add(new Message("USER", request.query(), LocalDateTime.now()));
        chat.getMessages().add(new Message("AI", request.answer(), LocalDateTime.now()));

        Chat savedChat = chatRepository.save(chat);

        return ResponseEntity.ok(Map.of("conversationId", savedChat.getId()));
    }

    // --- STREAMING ENDPOINT ---

    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> streamChat(@RequestBody ChatDTO.StreamRequest request, Principal principal) {
        String username = (principal != null) ? principal.getName() : "Anonymous";
        return aiStreamService.streamAnswer(request.query(), username, "fast");
    }
}
