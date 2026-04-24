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

    @Value("${HUGGINGFACE_API_TOKEN}")
    private String hfToken;

    public AiStreamService(WebClient.Builder webClientBuilder, 
                           @Value("${PYTHON_SERVICE_URL:https://gaurav-code098-alethiq.hf.space}") String aiEngineUrl) {
        this.webClient = webClientBuilder.baseUrl(aiEngineUrl).build();
    }

    public Flux<String> streamAnswer(String rawQueryJson, String username, String fast) {
        Map<String, String> body = new HashMap<>();
        body.put("query", rawQueryJson);
        body.put("mode", fast != null ? fast : "fast");

        return webClient.post()
                .uri("/query-stream")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + hfToken) // <-- The VIP Pass
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.TEXT_EVENT_STREAM)
                .bodyValue(body)
                .retrieve()
                .onStatus(HttpStatusCode::isError, response -> response.createException())
                .bodyToFlux(String.class);
    }
}
