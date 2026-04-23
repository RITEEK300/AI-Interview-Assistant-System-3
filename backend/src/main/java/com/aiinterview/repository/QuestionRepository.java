package com.aiinterview.repository;

import com.aiinterview.model.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {

    Optional<Question> findByKeywordIgnoreCase(String keyword);

    List<Question> findByKeywordContainingIgnoreCase(String keyword);

    @Query("SELECT q FROM Question q WHERE LOWER(q.keyword) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Question> searchByKeyword(@Param("keyword") String keyword);

    @Query("SELECT q FROM Question q WHERE LOWER(q.question) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Question> searchByQuestion(@Param("query") String query);

    @Query("SELECT q FROM Question q WHERE LOWER(q.question) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(q.keyword) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Question> fuzzySearch(@Param("query") String query);

    List<Question> findByCategoryIgnoreCase(String category);

    long countByCategory(String category);
}
