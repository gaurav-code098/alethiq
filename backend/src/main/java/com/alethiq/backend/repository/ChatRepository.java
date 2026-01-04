package com.alethiq.backend.repository;

import com.alethiq.backend.entity.Chat;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatRepository extends MongoRepository<Chat, String> {

    // Custom query: Find all chats belonging to a specific user
    List<Chat> findByUserId(String userId);
}