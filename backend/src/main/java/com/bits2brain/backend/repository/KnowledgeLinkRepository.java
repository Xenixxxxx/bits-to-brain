package com.bits2brain.backend.repository;

import com.bits2brain.backend.model.KnowledgeLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface KnowledgeLinkRepository extends JpaRepository<KnowledgeLink, UUID> {
    List<KnowledgeLink> findAllByFrom_Id(UUID fromId);
    List<KnowledgeLink> findAllByTo_Id(UUID toId);
}
