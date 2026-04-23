package com.aiinterview.repository;

import com.aiinterview.model.Session;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SessionRepository extends JpaRepository<Session, Long> {
    Optional<Session> findByReceiverId(String receiverId);
    boolean existsByReceiverId(String receiverId);
}
