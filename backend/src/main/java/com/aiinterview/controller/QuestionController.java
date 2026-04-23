package com.aiinterview.controller;

import com.aiinterview.model.dto.AnswerResponse;
import com.aiinterview.model.dto.ApiResponse;
import com.aiinterview.model.dto.QuestionRequest;
import com.aiinterview.service.QuestionService;
import com.aiinterview.service.SessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/questions")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "${app.cors.origins}")
public class QuestionController {

    private final QuestionService questionService;
    private final SessionService sessionService;
    private final SimpMessagingTemplate messagingTemplate;

    @PostMapping("/ask")
    public ResponseEntity<ApiResponse<AnswerResponse>> askQuestion(@Valid @RequestBody QuestionRequest request) {
        log.info("[ASK] Question received for receiver: {}", request.receiverId());

        if (request.receiverId() != null && !sessionService.isSessionActive(request.receiverId())) {
            return ResponseEntity.badRequest().body(ApiResponse.fail("Receiver session not active"));
        }

        AnswerResponse response = questionService.processQuestion(request);

        // Push answer via WebSocket to the specific receiver
        if (request.receiverId() != null) {
            messagingTemplate.convertAndSend("/topic/answers/" + request.receiverId(), response);
            log.info("[WS] Answer pushed to receiver: {}", request.receiverId());
        }

        return ResponseEntity.ok(ApiResponse.ok("Answer retrieved", response));
    }

    @GetMapping("/search-answer")
    public ResponseEntity<ApiResponse<AnswerResponse>> searchAnswer(@RequestParam String keyword) {
        log.info("[SEARCH] Searching for keyword: {}", keyword);
        AnswerResponse response = questionService.searchByKeyword(keyword);
        return ResponseEntity.ok(ApiResponse.ok("Answer found", response));
    }
}
