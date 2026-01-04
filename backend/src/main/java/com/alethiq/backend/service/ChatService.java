package com.alethiq.backend.service;

import com.alethiq.backend.dto.ChatDTO;
import com.alethiq.backend.entity.Chat;
import com.alethiq.backend.entity.Message;
import com.alethiq.backend.repository.ChatRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class ChatService {

    @Autowired
    private ChatRepository repository;

    // --- EXISTING METHODS ---
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

    // --- 🟢 NEW: SAVE STREAMED CONVERSATION ---
    public void saveConversation(String userId, String question, String fullResponse) {
        Chat chat = new Chat();
        chat.setId(UUID.randomUUID().toString());
        chat.setUserId(userId);

        // Generate title from first 30 chars
        String title = question.length() > 30 ? question.substring(0, 30) + "..." : question;
        chat.setTitle(title);

        chat.setCreatedAt(LocalDateTime.now());

        // Add User Question
        chat.getMessages().add(new Message("USER", question, LocalDateTime.now()));

        // Add AI Response
        chat.getMessages().add(new Message("AI", fullResponse, LocalDateTime.now()));

        // Save to Database
        repository.save(chat);
        System.out.println("💾 Chat saved to MongoDB for user: " + userId);
    }
}