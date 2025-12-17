package com.example.myteam.command;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class TaskVO {
    private Integer taskId;      // TASK_ID
    private Integer projectId;   // PROJECT_ID
    private Integer userId;      // USER_ID
    private String taskName;     // TASK_NAME
    private String description;  // DESCRIPTION
    private String status;       // STATUS
    private Boolean isCompleted; // IS_COMPLETED
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}