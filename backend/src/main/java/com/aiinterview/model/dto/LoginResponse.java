package com.aiinterview.model.dto;

public record LoginResponse(
    boolean success,
    String token,
    String username,
    String name,
    String role,
    String error
) {
    public static LoginResponse success(String username, String name, String role) {
        return new LoginResponse(true, "session-" + username, username, name, role, null);
    }

    public static LoginResponse fail(String error) {
        return new LoginResponse(false, null, null, null, null, error);
    }
}
