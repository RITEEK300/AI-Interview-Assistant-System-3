package com.aiinterview.model.dto;

import jakarta.validation.constraints.NotBlank;

public record QuestionRequest(
    @NotBlank String question,
    String receiverId
) {}
