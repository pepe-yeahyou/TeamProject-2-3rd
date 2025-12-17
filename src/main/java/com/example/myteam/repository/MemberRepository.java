package com.example.myteam.repository;

import com.example.myteam.entity.Member;
import com.example.myteam.entity.Project;
import com.example.myteam.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MemberRepository extends JpaRepository<Member, Long> {

    // 이 메서드를 추가하세요
    boolean existsByProjectProjectIdAndUserUserId(Long projectId, Long userId);
}