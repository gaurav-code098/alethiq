package com.alethiq.backend.controller;

import com.alethiq.backend.dto.ChatDTO;
import com.alethiq.backend.entity.Chat;
import com.alethiq.backend.entity.Message;
import com.alethiq.backend.entity.User;
import com.alethiq.backend.repository.ChatRepository;
import com.alethiq.backend.repository.UserRepository; /


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
    private UserRepository userRepository; // ✅ We need this to link new chats to users

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
        return ResponseEntity.ok("Alethiq Backend v3.3 - Threading Final");
    }

    // 🟢 THREADING SAVE LOGIC
    @PostMapping("/save-conversation")
    public ResponseEntity<?> saveConversation(@RequestBody ChatDTO.SaveConversationRequest request, Principal principal) {
        if (principal == null) return ResponseEntity.status(403).body("Not logged in");

        String username = principal.getName();
        
        // 1. Fetch User (To get the numeric ID)
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Chat chat = null;

        // 2. LOGIC: Append to existing or Create new?
        if (request.conversationId() != null) {
            // Append: Find existing Chat by ID
            Optional<Chat> existing = chatRepository.findById(String.valueOf(request.conversationId()));
            if (existing.isPresent()) {
                Chat foundChat = existing.get();
                // Security Check: Does this chat belong to this user?
                // Convert Long ID to String for comparison
                if (foundChat.getUserId().equals(String.valueOf(user.getId()))) {
                    chat = foundChat;
                }
            }
        }

        if (chat == null) {
            // Create New Chat
            chat = new Chat();
            chat.setUserId(String.valueOf(user.getId())); // ✅ Correctly link to user
            chat.setTitle(request.query()); 
            chat.setCreatedAt(LocalDateTime.now());
            chat.setMessages(new ArrayList<>());
            
            // Save immediately to generate an ID
            chat = chatRepository.save(chat);
        }

        // 3. Add Messages to the Chat's internal list
        if (chat.getMessages() == null) {
            chat.setMessages(new ArrayList<>());
        }
        
        // Create simple Message objects (POJO)
        chat.getMessages().add(new Message("USER", request.query(), LocalDateTime.now()));
        chat.getMessages().add(new Message("AI", request.answer(), LocalDateTime.now()));

        // 4. Save the Chat (This automatically saves the messages inside it)
        Chat savedChat = chatRepository.save(chat);

        // 5. Return the ID so React can use it for the next message
        // Convert String ID back to Long/String as needed. Frontend expects "conversationId"
        // If your Chat ID is a String in Java but you sent it as Long, just send it back as is.
        return ResponseEntity.ok(Map.of("conversationId", savedChat.getId()));
    }

    // --- STREAMING ENDPOINT ---

    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> streamChat(@RequestBody ChatDTO.StreamRequest request, Principal principal) {
        String username = (principal != null) ? principal.getName() : "Anonymous";
        return aiStreamService.streamAnswer(request.query(), username, "fast");
    }
}
