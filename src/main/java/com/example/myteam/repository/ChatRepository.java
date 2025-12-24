package com.example.myteam.repository;

import com.example.myteam.entity.Chat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChatRepository extends JpaRepository<Chat, Long> {
    // 필요한 추가 쿼리 메서드를 정의할 수 있습니다.
}