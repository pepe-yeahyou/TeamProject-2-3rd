package com.example.myteam.repository;
import com.example.myteam.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DetailRepository extends JpaRepository<Project, Long> {
    Optional<Project> findByProjectId(Long projectId);
}