package com.aiinterview.repository;

import com.aiinterview.model.Log;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LogRepository extends JpaRepository<Log, Long> {
    List<Log> findTop50ByOrderByTimestampDesc();
    long countBySource(String source);
}
