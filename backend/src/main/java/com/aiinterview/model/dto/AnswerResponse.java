package com.aiinterview.model.dto;

public record AnswerResponse(
    String question,
    String answer,
    String keyword,
    String source,
    Long responseTimeMs,
    String timestamp,
    String receiverId
) {}
