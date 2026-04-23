package com.aiinterview.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;

@Service
@Slf4j
public class AiService {

    @Value("${app.ai.api-key:}")
    private String apiKey;

    @Value("${app.ai.api-url:https://api.openai.com/v1/chat/completions}")
    private String apiUrl;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    public String generateAnswer(String question) {
        if (apiKey != null && !apiKey.isBlank()) {
            try {
                return callAiApi(question);
            } catch (Exception e) {
                log.warn("AI API call failed, using fallback: {}", e.getMessage());
            }
        }
        return generateFallbackAnswer(question);
    }

    private String callAiApi(String question) throws Exception {
        String requestBody = """
            {
              "model": "gpt-3.5-turbo",
              "messages": [
                {"role": "system", "content": "You are an interview assistant. Give concise, accurate answers in 2-3 sentences."},
                {"role": "user", "content": "%s"}
              ],
              "max_tokens": 200,
              "temperature": 0.3
            }
            """.formatted(question.replace("\"", "\\\"").replace("\n", "\\n"));

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(apiUrl))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + apiKey)
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .timeout(Duration.ofSeconds(15))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() == 200) {
            return extractContentFromJson(response.body());
        }
        throw new RuntimeException("AI API returned status: " + response.statusCode());
    }

    private String extractContentFromJson(String json) {
        try {
            int contentIndex = json.indexOf("\"content\"");
            if (contentIndex == -1) return generateFallbackAnswer("unknown");
            int start = json.indexOf("\"", contentIndex + 11) + 1;
            int end = json.indexOf("\"", start);
            String content = json.substring(start, end);
            return content.replace("\\n", "\n").replace("\\\"", "\"");
        } catch (Exception e) {
            return generateFallbackAnswer("unknown");
        }
    }

    private String generateFallbackAnswer(String question) {
        String q = question.toLowerCase();

        if (q.contains("java")) {
            if (q.contains("oop") || q.contains("object-oriented"))
                return "Java is an object-oriented programming language based on the principles of encapsulation, inheritance, and polymorphism. It supports classes, interfaces, and abstract types to model real-world entities. Java's platform independence comes from its JVM-based compilation to bytecode.";
            if (q.contains("multithreading") || q.contains("thread"))
                return "Java multithreading allows concurrent execution of two or more threads. It can be achieved by extending the Thread class or implementing the Runnable interface. Java also provides the Executor framework and CompletableFuture for better thread management.";
            if (q.contains("collection") || q.contains("arraylist"))
                return "The Java Collections Framework provides a unified architecture for representing and manipulating collections. Key interfaces include List (ArrayList, LinkedList), Set (HashSet, TreeSet), and Map (HashMap, TreeMap). Choose based on ordering, uniqueness, and performance requirements.";
            if (q.contains("exception"))
                return "Java exceptions are events that disrupt the normal flow of execution. Checked exceptions must be handled with try-catch or throws, while unchecked exceptions (RuntimeException) don't require explicit handling. Best practice is to catch specific exceptions and use custom exceptions for domain-specific errors.";
            if (q.contains("spring"))
                return "Spring Boot is a framework that simplifies Spring application development with auto-configuration, embedded servers, and production-ready features. It follows the convention-over-configuration principle and provides starters for rapid development. Key concepts include dependency injection, AOP, and MVC architecture.";
            return "Java is a versatile, platform-independent programming language widely used in enterprise applications. It follows the write-once-run-anywhere principle through JVM bytecode compilation. Its strong type system, garbage collection, and rich ecosystem make it ideal for large-scale systems.";
        }

        if (q.contains("dbms") || q.contains("database") || q.contains("sql")) {
            if (q.contains("normal"))
                return "Database normalization is the process of organizing data to reduce redundancy. 1NF eliminates repeating groups, 2NF removes partial dependencies, 3NF eliminates transitive dependencies, and BCNF handles anomalies that 3NF misses. Most practical applications normalize to 3NF.";
            if (q.contains("index"))
                return "Database indexes are data structures that improve query speed at the cost of write performance and storage. B-tree indexes are most common, while hash indexes excel at equality checks. Composite indexes should follow the leftmost prefix rule for optimal performance.";
            if (q.contains("acid"))
                return "ACID properties ensure reliable database transactions: Atomicity (all-or-nothing), Consistency (valid state transitions), Isolation (concurrent transactions don't interfere), and Durability (committed data persists). These guarantees are essential for financial and mission-critical systems.";
            if (q.contains("join"))
                return "SQL joins combine rows from multiple tables: INNER JOIN returns matching rows, LEFT JOIN returns all left rows with matched right rows, RIGHT JOIN is the reverse, and FULL OUTER JOIN returns all rows from both tables. Cross joins produce Cartesian products.";
            return "DBMS (Database Management System) is software for creating and managing databases. Relational DBMS uses tables with relationships, while NoSQL handles unstructured data. Key concepts include ACID properties, normalization, indexing, and query optimization.";
        }

        if (q.contains("hr") || q.contains("interview") || q.contains("behavioral")) {
            if (q.contains("weakness"))
                return "When discussing weaknesses, choose a genuine area for improvement and explain your strategy to address it. For example: 'I sometimes take on too many tasks, so I now use priority matrices to focus on what matters most.' Always show self-awareness and growth mindset.";
            if (q.contains("strength"))
                return "Highlight strengths that align with the role requirements. Use the STAR method (Situation, Task, Action, Result) to provide concrete examples. Focus on transferable skills like problem-solving, adaptability, and collaboration rather than generic traits.";
            if (q.contains("tell me about yourself") || q.contains("introduce"))
                return "Structure your introduction: present (current role/situation), past (relevant experience and achievements), and future (why this role excites you). Keep it under 2 minutes, focus on professional highlights, and connect your background to the position.";
            if (q.contains("why should we hire"))
                return "Connect your unique combination of skills, experience, and enthusiasm to the company's specific needs. Reference the job description, mention relevant achievements, and show you've researched the company. Demonstrate both competence and cultural fit.";
            return "In HR interviews, use the STAR method to structure behavioral answers: describe the Situation, your Task, the Action you took, and the Results achieved. Focus on specific examples that demonstrate leadership, problem-solving, and teamwork skills.";
        }

        return "This is a great interview question. The key is to demonstrate both theoretical understanding and practical experience. Focus on explaining the core concepts clearly, providing real-world examples, and showing how you've applied this knowledge in projects. Always connect your answer to the broader context of software engineering best practices.";
    }
}
