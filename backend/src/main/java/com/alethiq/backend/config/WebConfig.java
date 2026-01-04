package com.alethiq.backend.config; // ⚠️ Make sure this package name matches your folder structure!

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**") // Apply to all endpoints
                .allowedOrigins(
                        "https://alethiq.vercel.app/", // 🟢 Your Live Vercel Frontend
                        "http://localhost:5173",
                        "https://www.alethiq.tech/",
                        "https://alethiq.tech/",
                        "http://localhost:3000"                  // Localhost (React)
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}