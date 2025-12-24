package com.example.myteam.repository;

import com.example.myteam.entity.Member;
import com.example.myteam.entity.Project;
import com.example.myteam.entity.User;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface MemberRepository extends JpaRepository<Member, Long> {
    @Modifying
    @Query("delete from Member m where m.project.projectId = :projectId and m.isLeader = false")
    void deleteByProjectIdDirectly(@Param("projectId") Long projectId);
}