package com.bits2brain.backend.repository;

import com.bits2brain.backend.model.KnowledgeNode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface KnowledgeNodeRepository extends JpaRepository<KnowledgeNode, UUID> {
    Optional<KnowledgeNode> findByTitle(String title);
}

