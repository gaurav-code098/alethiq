package com.alethiq.backend.service;

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

    public AiStreamService(WebClient.Builder webClientBuilder) {
        // 🟢 RESTORED: Original hardcoded public URL
        String pythonUrl = "https://gaurav-code098-alethiq.hf.space";
        this.webClient = webClientBuilder.baseUrl(pythonUrl).build();
    }

    public Flux<String> streamAnswer(String rawQueryJson, String username, String fast) {
        System.out.println("🚀 Stream Request for: " + username);

        String cleanQuery = rawQueryJson;

        Map<String, String> body = new HashMap<>();
        body.put("query", cleanQuery);
        body.put("mode", fast != null ? fast : "fast");

        return webClient.post()
                .uri("/query-stream")
                // 🟢 REMOVED: Hugging Face Authorization header
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.TEXT_EVENT_STREAM)
                .bodyValue(body)
                .retrieve()
                .onStatus(HttpStatusCode::isError, response -> response.createException())
                .bodyToFlux(String.class)
                .doOnError(e -> System.out.println("🔥 Stream Error: " + e.getMessage()));
    }
}
