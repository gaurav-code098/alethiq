package com.alethiq.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono; // 🟢 Required for Mono.error()

import java.util.HashMap;
import java.util.Map;

@Service
public class AiStreamService {

    private final WebClient webClient;

    @Value("${huggingface.api.token}")
    private String hfToken;

    public AiStreamService(WebClient.Builder webClientBuilder,
                           @Value("${ai.engine.url:https://gaurav-code098-alethiq.hf.space}") String aiEngineUrl) {
        this.webClient = webClientBuilder.baseUrl(aiEngineUrl).build();
    }

    public Flux<String> streamAnswer(String rawQueryJson, String username, String fast) {
        // 🚀 Log the incoming request
        System.out.println("📬 [BACKEND] Received query for user: " + username);
        System.out.println("📡 [BACKEND] Forwarding to AI Engine...");

        Map<String, String> body = new HashMap<>();
        body.put("query", rawQueryJson);
        body.put("mode", fast != null ? fast : "fast");

        return webClient.post()
                .uri("/query-stream")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + hfToken)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.TEXT_EVENT_STREAM)
                .bodyValue(body)
                .retrieve()
                .onStatus(HttpStatusCode::isError, response -> {
                    // 🔴 This captures failures (401, 404, 500) from Hugging Face
                    return response.bodyToMono(String.class)
                            .flatMap(errorBody -> {
                                System.err.println("❌ [AI ENGINE ERROR] Status: " + response.statusCode());
                                System.err.println("❌ [AI ENGINE ERROR] Details: " + errorBody);
                                return Mono.error(new RuntimeException("AI Engine Error: " + response.statusCode()));
                            });
                })
                .bodyToFlux(String.class)
                .doOnNext(chunk -> {
                    // ✅ Log every time we get a piece of text back
                    System.out.println("⚡ [STREAM] Received data chunk");
                })
                .doOnError(e -> {
                    // 🔥 Log if the connection drops or something else breaks
                    System.err.println("🔥 [STREAM FAILED] Message: " + e.getMessage());
                })
                .doOnComplete(() -> {
                    System.out.println("🏁 [STREAM] Finished successfully");
                });
    }
}
