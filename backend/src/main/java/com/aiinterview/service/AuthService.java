package com.aiinterview.service;

import com.aiinterview.model.User;
import com.aiinterview.model.dto.LoginRequest;
import com.aiinterview.model.dto.LoginResponse;
import com.aiinterview.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;

    public LoginResponse login(LoginRequest request) {
        return userRepository.findByUsername(request.username())
                .filter(user -> user.getPassword().equals(request.password()))
                .map(user -> LoginResponse.success(user.getUsername(), user.getName(), user.getRole()))
                .orElse(LoginResponse.fail("Invalid username or password"));
    }
}
