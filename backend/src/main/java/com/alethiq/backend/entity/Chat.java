package com.alethiq.backend.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@Document(collection = "chats") // Creates a "chats" collection in Mongo
public class Chat {

    @Id
    private String id;

    private String userId;
    private String title;

    private LocalDateTime createdAt;

    // We store the messages directly inside the Chat object
    private List<Message> messages = new ArrayList<>();
}