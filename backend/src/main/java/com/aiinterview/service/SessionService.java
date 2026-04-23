package com.aiinterview.service;

import com.aiinterview.model.Session;
import com.aiinterview.model.Session.ActiveStatus;
import com.aiinterview.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SessionService {

    private final SessionRepository sessionRepository;

    public String generateReceiverId() {
        String id;
        do {
            id = "REC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        } while (sessionRepository.existsByReceiverId(id));

        Session session = Session.builder()
                .receiverId(id)
                .activeStatus(ActiveStatus.ACTIVE)
                .build();
        sessionRepository.save(session);
        log.info("[SESSION] New receiver ID generated: {}", id);
        return id;
    }

    public boolean connectSender(String receiverId, Long senderId) {
        return sessionRepository.findByReceiverId(receiverId)
                .map(session -> {
                    session.setSenderId(senderId);
                    session.setActiveStatus(ActiveStatus.ACTIVE);
                    sessionRepository.save(session);
                    log.info("[SESSION] Sender {} connected to {}", senderId, receiverId);
                    return true;
                })
                .orElse(false);
    }

    public boolean isSessionActive(String receiverId) {
        return sessionRepository.findByReceiverId(receiverId)
                .map(s -> s.getActiveStatus() == ActiveStatus.ACTIVE)
                .orElse(false);
    }

    public void disconnectSession(String receiverId) {
        sessionRepository.findByReceiverId(receiverId).ifPresent(session -> {
            session.setActiveStatus(ActiveStatus.INACTIVE);
            sessionRepository.save(session);
            log.info("[SESSION] Disconnected: {}", receiverId);
        });
    }
}
