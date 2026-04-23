package com.aiinterview.controller;

import com.aiinterview.model.dto.ApiResponse;
import com.aiinterview.model.dto.LoginRequest;
import com.aiinterview.model.dto.LoginResponse;
import com.aiinterview.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "${app.cors.origins}")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        if (response.success()) {
            return ResponseEntity.ok(ApiResponse.ok("Login successful", response));
        }
        return ResponseEntity.status(401).body(ApiResponse.fail(response.error()));
    }

    @GetMapping("/validate")
    public ResponseEntity<ApiResponse<String>> validate(@RequestParam String username) {
        return ResponseEntity.ok(ApiResponse.ok("Valid session", username));
    }
}
