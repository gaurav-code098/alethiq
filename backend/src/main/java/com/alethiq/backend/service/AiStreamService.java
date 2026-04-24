package com.alethiq.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
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

    // 🟢 SECURE: Pulls the token from your application.properties
    @Value("${huggingface.api.token}")
    private String hfToken;

    // 🟢 REMOVED: ChatService dependency (not needed here anymore)

    public AiStreamService(WebClient.Builder webClientBuilder, 
                           @Value("${ai.engine.url:https://gaurav-code098-alethiq.hf.space}") String aiEngineUrl) {
        // Now uses a configurable URL, defaulting to your Space
        this.webClient = webClientBuilder.baseUrl(aiEngineUrl).build();
    }

    public Flux<String> streamAnswer(String rawQueryJson, String username, String fast) {
        System.out.println("🚀 Stream Request for: " + username);

 
        String cleanQuery = rawQueryJson;


        Map<String, String> body = new HashMap<>();
        body.put("query", cleanQuery);
        body.put("mode", fast != null ? fast : "fast");

        return webClient.post()
                .uri("/query-stream")
              
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + hfToken)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.TEXT_EVENT_STREAM)
                .bodyValue(body)
                .retrieve()
                .onStatus(HttpStatusCode::isError, response -> response.createException())
                .bodyToFlux(String.class)
                .doOnError(e -> System.out.println("🔥 Stream Error: " + e.getMessage()));
                
   \
    }
}
