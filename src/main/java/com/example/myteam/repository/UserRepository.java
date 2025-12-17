package com.example.myteam.repository;

import com.example.myteam.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Query Method 방식으로 사용자 검색
     * displayName이나 username에 검색어가 포함된 사용자 조회
     * Pageable을 사용하여 limit(결과 제한) 처리
     */
    List<User> findByDisplayNameContainingOrUsernameContaining(
            String displayName,
            String username
    );
}