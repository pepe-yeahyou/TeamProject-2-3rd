package com.example.myteam.repository;

import com.example.myteam.entity.Task; // Task 엔티티의 실제 경로로 수정 필요
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

public interface TaskRepository extends JpaRepository<Task, Long> {

    @Modifying(clearAutomatically = true) // 💡 실행 후 영속성 컨텍스트를 비워주는 옵션
    @Transactional
    @Query("DELETE FROM Task t WHERE t.project.projectId = :projectId")
    void deleteByProjectIdDirectly(Long projectId);
}