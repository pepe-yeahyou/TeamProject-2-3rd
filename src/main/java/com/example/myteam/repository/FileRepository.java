package com.example.myteam.repository;

import com.example.myteam.entity.FileEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FileRepository extends JpaRepository<FileEntity, Long> {

    // Project ID로 연결된 모든 FileEntity를 조회하는 메서드
    List<FileEntity> findByProject_ProjectId(Long projectId);
    Optional<FileEntity> findByFileId(Long fileId);
}