package com.aiinterview.service;

import com.aiinterview.model.Log;
import com.aiinterview.model.Question;
import com.aiinterview.model.dto.AnswerResponse;
import com.aiinterview.model.dto.QuestionRequest;
import com.aiinterview.repository.LogRepository;
import com.aiinterview.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class QuestionService {

    private final QuestionRepository questionRepository;
    private final LogRepository logRepository;
    private final AiService aiService;

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final Set<String> STOP_WORDS = Set.of(
            "what", "how", "why", "when", "where", "the", "is", "are",
            "can", "does", "do", "did", "will", "would", "could", "should",
            "explain", "describe", "tell", "about", "between", "difference"
    );

    public AnswerResponse processQuestion(QuestionRequest request) {
        long start = System.currentTimeMillis();
        String questionText = request.question().trim();

        // Step 1: Check cache (handled by Spring @Cacheable on findInDb)
        // Step 2: Check DB - exact match
        Optional<Question> exactMatch = findExactMatch(questionText);
        if (exactMatch.isPresent()) {
            Question q = exactMatch.get();
            long time = System.currentTimeMillis() - start;
            logResponse(questionText, q.getAnswer(), "DB", time);
            log.info("[DB HIT] Question matched exactly in {}ms", time);
            return buildResponse(questionText, q.getAnswer(), q.getKeyword(), "DB", time, request.receiverId());
        }

        // Step 3: Check DB - fuzzy match
        List<Question> fuzzyMatches = questionRepository.fuzzySearch(questionText);
        if (!fuzzyMatches.isEmpty()) {
            Question q = fuzzyMatches.get(0);
            long time = System.currentTimeMillis() - start;
            logResponse(questionText, q.getAnswer(), "DB", time);
            log.info("[DB FUZZY] Question matched fuzzily in {}ms", time);
            return buildResponse(questionText, q.getAnswer(), q.getKeyword(), "DB", time, request.receiverId());
        }

        // Step 4: AI fallback
        String aiAnswer = aiService.generateAnswer(questionText);
        long time = System.currentTimeMillis() - start;
        logResponse(questionText, aiAnswer, "AI", time);
        log.info("[AI FALLBACK] Generated answer in {}ms", time);
        return buildResponse(questionText, aiAnswer, extractKeyword(questionText), "AI", time, request.receiverId());
    }

    @Cacheable(value = "questions", key = "#questionText.toLowerCase()")
    public Optional<Question> findExactMatch(String questionText) {
        // Try keyword match first
        String keyword = extractKeyword(questionText);
        Optional<Question> byKeyword = questionRepository.findByKeywordIgnoreCase(keyword);
        if (byKeyword.isPresent()) return byKeyword;

        // Try question text match
        List<Question> byQuestion = questionRepository.searchByQuestion(questionText);
        if (!byQuestion.isEmpty()) return Optional.of(byQuestion.get(0));

        return Optional.empty();
    }

    private String extractKeyword(String questionText) {
        String[] words = questionText.toLowerCase()
                .replaceAll("[^a-z0-9\\s]", "")
                .split("\\s+");
        StringBuilder keyword = new StringBuilder();
        for (int i = 0; i < Math.min(words.length, 4); i++) {
            if (words[i].length() > 2 && !isStopWord(words[i])) {
                if (keyword.length() > 0) keyword.append(" ");
                keyword.append(words[i]);
            }
        }
        return keyword.length() > 0 ? keyword.toString() : questionText;
    }

    private boolean isStopWord(String word) {
        return STOP_WORDS.contains(word);
    }

    private void logResponse(String question, String answer, String source, long responseTimeMs) {
        Log logEntry = Log.builder()
                .question(question)
                .answer(answer)
                .source(source)
                .responseTimeMs(responseTimeMs)
                .timestamp(LocalDateTime.now())
                .build();
        logRepository.save(logEntry);
    }

    private AnswerResponse buildResponse(String question, String answer, String keyword, String source,
                                          long responseTimeMs, String receiverId) {
        return new AnswerResponse(
                question,
                answer,
                keyword,
                source,
                responseTimeMs,
                LocalDateTime.now().format(FMT),
                receiverId
        );
    }

    // Search by keyword for frontend preview
    public AnswerResponse searchByKeyword(String keyword) {
        long start = System.currentTimeMillis();
        String normalizedKeyword = keyword.trim().toLowerCase();

        // Step 1: Try exact keyword match
        Optional<Question> exactMatch = questionRepository.findByKeywordIgnoreCase(normalizedKeyword);
        if (exactMatch.isPresent()) {
            Question q = exactMatch.get();
            long time = System.currentTimeMillis() - start;
            log.info("[KEYWORD HIT] Exact match in {}ms", time);
            return buildResponse(q.getQuestion(), q.getAnswer(), q.getKeyword(), "DB", time, null);
        }

        // Step 2: Try partial keyword match (LIKE)
        List<Question> partialMatches = questionRepository.findByKeywordContainingIgnoreCase(normalizedKeyword);
        if (!partialMatches.isEmpty()) {
            Question q = partialMatches.get(0); // Return first match
            long time = System.currentTimeMillis() - start;
            log.info("[KEYWORD PARTIAL] Found {} matches in {}ms", partialMatches.size(), time);
            return buildResponse(q.getQuestion(), q.getAnswer(), q.getKeyword(), "DB", time, null);
        }

        // Step 3: Try fuzzy search on question text
        List<Question> fuzzyMatches = questionRepository.fuzzySearch(keyword);
        if (!fuzzyMatches.isEmpty()) {
            Question q = fuzzyMatches.get(0);
            long time = System.currentTimeMillis() - start;
            log.info("[KEYWORD FUZZY] Found {} matches in {}ms", fuzzyMatches.size(), time);
            return buildResponse(q.getQuestion(), q.getAnswer(), q.getKeyword(), "DB", time, null);
        }

        // Step 4: AI fallback
        String aiAnswer = aiService.generateAnswer(keyword);
        long time = System.currentTimeMillis() - start;
        log.info("[KEYWORD AI FALLBACK] Generated answer in {}ms", time);
        return buildResponse(keyword, aiAnswer, keyword, "AI", time, null);
    }

    private AnswerResponse buildResponse(String question, String answer, String keyword, String source,
                                          long responseTimeMs, String receiverId) {
        return new AnswerResponse(
                question,
                answer,
                source,
                responseTimeMs,
                LocalDateTime.now().format(FMT),
                receiverId
        );
    }

    // Admin operations
    public List<Question> getAllQuestions() {
        return questionRepository.findAll();
    }

    public List<Question> searchQuestions(String query) {
        return questionRepository.fuzzySearch(query);
    }

    public List<Question> getByCategory(String category) {
        return questionRepository.findByCategoryIgnoreCase(category);
    }

    public Question addQuestion(Question question) {
        return questionRepository.save(question);
    }

    public Question updateQuestion(Long id, Question updated) {
        return questionRepository.findById(id)
                .map(existing -> {
                    existing.setKeyword(updated.getKeyword());
                    existing.setQuestion(updated.getQuestion());
                    existing.setAnswer(updated.getAnswer());
                    existing.setCategory(updated.getCategory());
                    return questionRepository.save(existing);
                })
                .orElseThrow(() -> new RuntimeException("Question not found"));
    }

    public void deleteQuestion(Long id) {
        questionRepository.deleteById(id);
    }

    public List<Log> getRecentLogs() {
        return logRepository.findTop50ByOrderByTimestampDesc();
    }
}
