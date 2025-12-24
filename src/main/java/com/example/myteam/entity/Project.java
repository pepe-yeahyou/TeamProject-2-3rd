package com.example.myteam.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;     // START_DATE, END_DATE용
import java.time.LocalDateTime; // CREATED_AT, UPDATED_AT용
import java.util.List;

@Entity
@Data // get/set, toString, equals/hashCode 자동 생성
@Table(name = "PROJECT")
public class Project {

    // PRIMARY KEY
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "PROJECT_ID")
    private Long projectId;

    // PROJECT_TITLE
    @Column(name = "PROJECT_TITLE", length = 50)
    private String projectTitle;

    // DESCRIPTION
    @Column(name = "DESCRIPTION", columnDefinition = "TEXT")
    private String description;

    // STATUS (기능 정의서에 따라 추가)
    @Column(name = "STATUS", length = 20)
    private String status;

    // START_DATE
    @Column(name = "START_DATE")
    private LocalDate startDate; // DATE 타입

    // END_DATE
    @Column(name = "END_DATE")
    private LocalDate endDate; // DATE 타입

    // CREATED_AT
    @Column(name = "CREATED_AT")
    private LocalDateTime createdAt; // DATETIME 타입

    // UPDATED_AT
    @Column(name = "UPDATED_AT")
    private LocalDateTime updatedAt; // DATETIME 타입

    // ---------------------- 관계 매핑 ----------------------

    // OWNER_ID (PROJECT.OWNER_ID -> USER)
    // DetailServiceImpl에서 project.getOwner().getUserId() 호출에 필수
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "OWNER_ID", nullable = false)
    private User owner;

    // PROJECT -> MEMBER (팀원 목록)
    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL)
    private List<Member> members;

    // PROJECT -> FILE (첨부 파일 목록)
    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL)
    private List<FileEntity> attachedFiles;

    // PROJECT -> TASK (업무 목록 - 진척도 계산에 필수)
    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL)
    private List<Task> tasks;
}