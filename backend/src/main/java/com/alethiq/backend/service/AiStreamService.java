package com.alethiq.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
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

    // 🟢 REMOVED: ChatService dependency (not needed here anymore)

    public AiStreamService(WebClient.Builder webClientBuilder) {
        String pythonUrl = "https://gaurav-code098-alethiq.hf.space";
        this.webClient = webClientBuilder.baseUrl(pythonUrl).build();
    }

    public Flux<String> streamAnswer(String rawQueryJson, String username, String fast) {
        System.out.println("🚀 Stream Request for: " + username);

        // Parse query (simple version)
        String cleanQuery = rawQueryJson;
        // (Optional: You can keep your JSON parsing logic here if you want, 
        // but passing the raw string is often safer if the frontend sends a simple string)

        Map<String, String> body = new HashMap<>();
        body.put("query", cleanQuery);
        body.put("mode", "fast");

        return webClient.post()
                .uri("/query-stream")
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.TEXT_EVENT_STREAM)
                .bodyValue(body)
                .retrieve()
                .onStatus(HttpStatusCode::isError, response -> response.createException())
                .bodyToFlux(String.class)
                .doOnError(e -> System.out.println("🔥 Stream Error: " + e.getMessage()));
                
                // 🟢 REMOVED: .doOnComplete(saveConversation)
                // We now rely on the Frontend (App.jsx) to call /save-conversation
    }
}
