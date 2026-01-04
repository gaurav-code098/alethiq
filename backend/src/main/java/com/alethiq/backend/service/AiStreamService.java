package com.alethiq.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import java.util.HashMap;
import java.util.Map;

@Service
public class AiStreamService {

    private final WebClient webClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private ChatService chatService;

    public AiStreamService(WebClient.Builder webClientBuilder) {
        String pythonUrl = "https://gaurav-code098-alethiq.hf.space";
        this.webClient = webClientBuilder.baseUrl(pythonUrl).build();
    }

    public Flux<String> streamAnswer(String rawQueryJson, String username, String fast) {
        System.out.println("\n🚀 STARTING STREAM for User: " + username);

        // 🟢 FIX: Parse the incoming JSON to get the real query text
        String cleanQuery = rawQueryJson;
        try {
            JsonNode root = objectMapper.readTree(rawQueryJson);
            if (root.has("query")) {
                cleanQuery = root.get("query").asText();
            }
        } catch (Exception e) {
            System.out.println("⚠️ Could not parse query JSON, using raw string.");
        }

        // Buffer for the AI response
        StringBuilder cleanTextBuffer = new StringBuilder();
        // We need 'final' for the lambda, so copy the clean query
        final String finalUserQuery = cleanQuery;

        // Send to Python (Python expects the JSON object, so we send the map)
        Map<String, String> body = new HashMap<>();
        body.put("query", cleanQuery);

        return webClient.post()
                .uri("/query-stream")
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.TEXT_EVENT_STREAM)
                .bodyValue(body)
                .retrieve()
                .onStatus(HttpStatusCode::isError, response -> response.createException())
                .bodyToFlux(String.class)
                .doOnNext(chunk -> {
                    // Extract answer text from Python's chunked JSON
                    try {
                        String[] lines = chunk.split("\n");
                        for (String line : lines) {
                            if (line.trim().isEmpty() || line.equals("[DONE]")) continue;
                            if (line.startsWith("data:")) line = line.replace("data:", "").trim();
                            try {
                                JsonNode node = objectMapper.readTree(line);
                                if (node.has("answer_chunk")) {
                                    cleanTextBuffer.append(node.get("answer_chunk").asText());
                                }
                            } catch (Exception e) { }
                        }
                    } catch (Exception e) {}
                })
                .doOnError(e -> System.out.println("🔥 Stream Error: " + e.getMessage()))
                .doOnComplete(() -> {
                    System.out.println("✅ Stream Finished. Saving Clean Data...");
                    // 🟢 SAVE using the clean query title
                    chatService.saveConversation(username, finalUserQuery, cleanTextBuffer.toString());
                });
    }
}