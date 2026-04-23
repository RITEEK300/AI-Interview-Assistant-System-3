package com.aiinterview.controller;

import com.aiinterview.model.dto.ApiResponse;
import com.aiinterview.service.SessionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "${app.cors.origins}")
public class SessionController {

    private final SessionService sessionService;

    @PostMapping("/generate")
    public ResponseEntity<ApiResponse<Map<String, String>>> generateReceiverId() {
        String receiverId = sessionService.generateReceiverId();
        return ResponseEntity.ok(ApiResponse.ok("Receiver ID generated", Map.of("receiverId", receiverId)));
    }

    @PostMapping("/connect")
    public ResponseEntity<ApiResponse<String>> connect(@RequestBody Map<String, String> body) {
        String receiverId = body.get("receiverId");
        Long senderId = body.get("senderId") != null ? Long.parseLong(body.get("senderId")) : null;

        boolean connected = sessionService.connectSender(receiverId, senderId);
        if (connected) {
            return ResponseEntity.ok(ApiResponse.ok("Connected successfully", receiverId));
        }
        return ResponseEntity.badRequest().body(ApiResponse.fail("Invalid receiver ID"));
    }

    @PostMapping("/disconnect")
    public ResponseEntity<ApiResponse<String>> disconnect(@RequestBody Map<String, String> body) {
        String receiverId = body.get("receiverId");
        sessionService.disconnectSession(receiverId);
        return ResponseEntity.ok(ApiResponse.ok("Disconnected", receiverId));
    }

    @GetMapping("/status/{receiverId}")
    public ResponseEntity<ApiResponse<Boolean>> status(@PathVariable String receiverId) {
        boolean active = sessionService.isSessionActive(receiverId);
        return ResponseEntity.ok(ApiResponse.ok(active ? "Active" : "Inactive", active));
    }
}
