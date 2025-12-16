package com.example.myteam.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "MEMBER")
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MEMBER_ID")
    private Long memberId;

    // PROJECT_ID (MEMBER가 속한 프로젝트)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PROJECT_ID", nullable = false)
    private Project project;

    // USER_ID (MEMBER에 해당하는 사용자)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "USER_ID", nullable = false)
    private User user;

    @Column(name = "IS_LEADER")
    private Boolean isLeader;

    @Column(name = "JOINED_AT")
    private LocalDateTime joinedAt;
}