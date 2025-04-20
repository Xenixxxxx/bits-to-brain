package com.bits2brain.backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Type;

import java.time.Instant;
import java.util.UUID;


@Entity
@Table(name = "knowledge_link")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KnowledgeLink {

    @Id
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "from_id")
    private KnowledgeNode from;

    @ManyToOne
    @JoinColumn(name = "to_id")
    private KnowledgeNode to;

    private Float score;

    private Instant createdAt;
}
