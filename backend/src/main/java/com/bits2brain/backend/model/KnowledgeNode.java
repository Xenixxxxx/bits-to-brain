package com.bits2brain.backend.model;

import com.bits2brain.backend.util.FloatArrayToStringConverter;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "knowledge_node")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KnowledgeNode {

    @Id
    private UUID id;

    private String title;

    private String sourceType;

    private Instant createdAt;
}
