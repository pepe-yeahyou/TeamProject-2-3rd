package com.example.myteam.repository;

import com.example.myteam.entity.Chat;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatRepository extends JpaRepository<Chat, Integer> {

    // 프로젝트 ID로 최근 메시지 조회 (내림차순), Pageable로 10개만 가져오기
    @Query("SELECT c FROM Chat c WHERE c.projectId = :projectId ORDER BY c.timestamp DESC")
    List<Chat> findLastChatsByProjectId(Integer projectId, Pageable pageable);
}
