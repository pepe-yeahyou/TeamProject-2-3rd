package com.example.myteam.command;

import lombok.Builder;
import lombok.Data; // @Data 사용

@Data
@Builder
public class TaskVO {
    private Long taskId;
    private String taskName;
    private String assignedUserName;
    private String status;
    private boolean isCompleted;
}