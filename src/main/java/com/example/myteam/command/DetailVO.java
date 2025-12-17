package com.example.myteam.command;

import lombok.Builder;
import lombok.Data; // @Data 사용
import java.time.LocalDate;
import java.util.List;

@Data // @Getter, @Setter, @ToString, @EqualsAndHashCode 등을 대체
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
}