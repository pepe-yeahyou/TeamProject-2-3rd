package com.example.myteam.repository;

import com.example.myteam.entity.Task; // Task 엔티티의 실제 경로로 수정 필요
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
}