package com.alethiq.backend.config;

import com.alethiq.backend.entity.User;
import com.alethiq.backend.repository.UserRepository;
import com.alethiq.backend.service.CustomUserDetailsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;
import java.util.UUID;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserRepository userRepository;

    // Use default just in case property is missing
    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests(auth -> auth
                        // 🟢 PUBLIC ENDPOINTS (Anyone can access)
                        .requestMatchers(
                                "/api/auth/**",
                                "/health",
                                "/api/chat/stream",
                                "/get-suggestions",
                                "/api/chat/version"
                        ).permitAll()
                        // 🔒 EVERYTHING ELSE IS LOCKED
                        .anyRequest().authenticated()
                )
                .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)

                // Google Login Support
                .oauth2Login(oauth2 -> oauth2
                        .successHandler((request, response, authentication) -> {
                            OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
                            String email = oAuth2User.getAttribute("email");
                            String name = oAuth2User.getAttribute("name");

                            User user = userRepository.findByEmail(email).orElseGet(() -> {
                                User newUser = new User();
                                newUser.setUsername(name.replaceAll("\\s+", "") + "_" + UUID.randomUUID().toString().substring(0,4));
                                newUser.setEmail(email);
                                newUser.setPassword("");
                                newUser.setRole("USER");
                                return userRepository.save(newUser);
                            });

                            String token = jwtUtil.generateToken(user.getUsername());

                            // 🟢 CRITICAL FIX: Hardcoded to force redirect to your Live Domain
                            response.sendRedirect("https://alethiq.tech?token=" + token);
                        })
                );

        return http.build();
    }

    @Bean
    public UrlBasedCorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // 🟢 UPDATE: Allow all your frontend versions
        config.setAllowedOrigins(List.of(
                "http://localhost:3000",                  // Localhost (React)
                "http://localhost:5173",                  // Localhost (Vite)
                "https://alethiq-frontend.vercel.app",    // Your Vercel URL
                "https://alethiq.tech",                   // Your Custom Domain
                "https://www.alethiq.tech",               // Your Custom Domain (www)
                frontendUrl                               // The variable from properties
        ));

        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
