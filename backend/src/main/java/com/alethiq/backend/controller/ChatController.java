package com.alethiq.backend.controller;

import com.alethiq.backend.dto.ChatDTO;
import com.alethiq.backend.entity.Chat;
import com.alethiq.backend.entity.Message;
import com.alethiq.backend.entity.User;
import com.alethiq.backend.repository.ChatRepository;
import com.alethiq.backend.repository.MessageRepository;
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

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    @Autowired
    private ChatService chatService;

    @Autowired
    private AiStreamService aiStreamService;

    // 🟢 NEW: Direct access to Repositories for Threading Logic
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ChatRepository chatRepository;

    @Autowired
    private MessageRepository messageRepository;

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
        System.out.println("✅ Version Check Hit!");
        return ResponseEntity.ok("Alethiq Backend v3.1 - Threading Active");
    }

    // 🟢 THE NEW "SMART" SAVE METHOD (Supports Threading)
    @PostMapping("/save-conversation")
    public ResponseEntity<?> saveConversation(@RequestBody ChatDTO.SaveConversationRequest request, Principal principal) {
        if (principal == null) return ResponseEntity.status(403).body("Not logged in");

        String username = principal.getName();
        
        // 1. Fetch User
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Chat chat;

        // 2. LOGIC: Append to existing or Create new?
        if (request.conversationId() != null) {
     
     
            chat = chatRepository.findById(String.valueOf(request.conversationId())) 
                    .orElseThrow(() -> new RuntimeException("Chat not found"));


             if (!chat.getUserId().equals(String.valueOf(user.getId()))) {
                 return ResponseEntity.status(403).body("Unauthorized access to chat");
             }
        } else {
            //  CREATE: Start new Chat
            chat = new Chat();
            chat.setUserId(String.valueOf(user.getId())); 
            chat.setTitle(request.query()); // Set title to the first question
            chat.setCreatedAt(LocalDateTime.now());
            chat.setMessages(new ArrayList<>()); // Init list
            
            // Save the chat first to generate an ID
            chat = chatRepository.save(chat);
        }

        // 3. Create Messages
        Message userMsg = new Message();
        userMsg.setRole("USER");
        userMsg.setContent(request.query());
        userMsg.setTimestamp(LocalDateTime.now());
     

        Message aiMsg = new Message();
        aiMsg.setRole("AI");
        aiMsg.setContent(request.answer());
        aiMsg.setTimestamp(LocalDateTime.now());

        chat.getMessages().add(userMsg);
        chat.getMessages().add(aiMsg);
        
        Chat savedChat = chatRepository.save(chat);

        System.out.println("✅ SAVED THREAD ID: " + savedChat.getId());

     
        return ResponseEntity.ok(Map.of("conversationId", savedChat.getId()));
    }

    // --- STREAMING ENDPOINT ---

    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> streamChat(@RequestBody ChatDTO.StreamRequest request, Principal principal) {
        String username = (principal != null) ? principal.getName() : "Anonymous";
        String query = request.query();
        return aiStreamService.streamAnswer(query, username, "fast");
    }
}
