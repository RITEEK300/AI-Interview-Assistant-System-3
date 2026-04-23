package com.aiinterview.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HomeController {

    @GetMapping("/")
    public Map<String, Object> home() {
        return Map.of(
            "status", "running",
            "service", "AI Interview Assistant API",
            "version", "1.0.0",
            "endpoints", Map.of(
                "auth", "/api/auth/login",
                "questions", "/api/questions/ask",
                "sessions", "/api/sessions/*",
                "admin", "/api/admin/*"
            )
        );
    }
}
