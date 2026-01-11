package com.alethiq.backend.service;

import com.alethiq.backend.dto.ChatDTO;
import com.alethiq.backend.entity.Chat;
import com.alethiq.backend.entity.Message;
import com.alethiq.backend.entity.User; // Import User
import com.alethiq.backend.repository.ChatRepository;
import com.alethiq.backend.repository.UserRepository; // Import UserRepository
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // Good practice

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class ChatService {

    @Autowired
    private ChatRepository repository;

    @Autowired
    private UserRepository userRepository; // 🟢 Added to look up User ID from Username

    // --- EXISTING METHODS (Kept mostly the same) ---

    public Chat createChat(ChatDTO.NewChatRequest request) {
        Chat chat = new Chat();
        chat.setId(UUID.randomUUID().toString());
        chat.setUserId(request.userId());
        chat.setTitle(request.content().substring(0, Math.min(request.content().length(), 20)) + "...");
        chat.setCreatedAt(LocalDateTime.now());
        chat.getMessages().add(new Message("USER", request.content(), LocalDateTime.now()));
        chat.getMessages().add(new Message("AI", "Dummy Response", LocalDateTime.now()));
        return repository.save(chat);
    }

    public Chat addMessage(String chatId, String content) {
        Chat chat = repository.findById(chatId)
                .orElseThrow(() -> new RuntimeException("Chat not found!"));
        chat.getMessages().add(new Message("USER", content, LocalDateTime.now()));
        chat.getMessages().add(new Message("AI", "Received: " + content, LocalDateTime.now()));
        return repository.save(chat);
    }

    public List<Chat> getUserChats(String userId) {
        return repository.findByUserId(userId);
    }

    public Chat getChatById(String id) {
        return repository.findById(id).orElseThrow(() -> new RuntimeException("Chat not found"));
    }

    // --- 🟢 NEW: THE MISSING METHOD (Fixes Compilation Error) ---
    
  // ... inside ChatService ...

    @Transactional
    public Chat saveFullConversation(String username, String query, String answer) {
        // 🟢 FIND USER BY USERNAME (Matches the Token)
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        // Create Chat
        Chat chat = new Chat();
        chat.setId(java.util.UUID.randomUUID().toString());
        chat.setUserId(String.valueOf(user.getId())); // Store the ID for the database
        
        chat.setTitle(query.length() > 30 ? query.substring(0, 30) + "..." : query);
        chat.setCreatedAt(java.time.LocalDateTime.now());

        // Add Messages
        chat.getMessages().add(new Message("USER", query, java.time.LocalDateTime.now()));
        chat.getMessages().add(new Message("AI", answer, java.time.LocalDateTime.now()));

        return repository.save(chat);
    }
}
