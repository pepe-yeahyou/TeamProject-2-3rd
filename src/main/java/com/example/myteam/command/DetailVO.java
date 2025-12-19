package com.example.myteam.command;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
public class DetailVO {
    private Long projectId;
    private String title;
    private String description;
    private String status;
    private int progressPercentage;

    private Long ownerId;
    private String managerName;
    private List<MemberVO> coWorkers;

    private List<TaskVO> workList;
    private List<FileVO> attachedFiles;

    private boolean isChatActive;

    // 💡 [추가] 기간 데이터 필드
    private LocalDate startDate;
    private LocalDate endDate;
}