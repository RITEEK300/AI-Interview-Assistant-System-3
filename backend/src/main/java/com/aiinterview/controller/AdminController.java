package com.aiinterview.controller;

import com.aiinterview.model.Log;
import com.aiinterview.model.Question;
import com.aiinterview.model.dto.ApiResponse;
import com.aiinterview.service.QuestionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "${app.cors.origins}")
public class AdminController {

    private final QuestionService questionService;

    @GetMapping("/questions")
    public ResponseEntity<ApiResponse<List<Question>>> getAllQuestions() {
        return ResponseEntity.ok(ApiResponse.ok(questionService.getAllQuestions()));
    }

    @GetMapping("/questions/search")
    public ResponseEntity<ApiResponse<List<Question>>> searchQuestions(@RequestParam String q) {
        return ResponseEntity.ok(ApiResponse.ok(questionService.searchQuestions(q)));
    }

    @GetMapping("/questions/category/{category}")
    public ResponseEntity<ApiResponse<List<Question>>> getByCategory(@PathVariable String category) {
        return ResponseEntity.ok(ApiResponse.ok(questionService.getByCategory(category)));
    }

    @PostMapping("/questions")
    public ResponseEntity<ApiResponse<Question>> addQuestion(@RequestBody Question question) {
        return ResponseEntity.ok(ApiResponse.ok("Question added", questionService.addQuestion(question)));
    }

    @PutMapping("/questions/{id}")
    public ResponseEntity<ApiResponse<Question>> updateQuestion(
            @PathVariable Long id, @RequestBody Question question) {
        return ResponseEntity.ok(ApiResponse.ok("Question updated", questionService.updateQuestion(id, question)));
    }

    @DeleteMapping("/questions/{id}")
    public ResponseEntity<ApiResponse<String>> deleteQuestion(@PathVariable Long id) {
        questionService.deleteQuestion(id);
        return ResponseEntity.ok(ApiResponse.ok("Question deleted", "ID: " + id));
    }

    @GetMapping("/logs")
    public ResponseEntity<ApiResponse<List<Log>>> getRecentLogs() {
        return ResponseEntity.ok(ApiResponse.ok(questionService.getRecentLogs()));
    }
}
