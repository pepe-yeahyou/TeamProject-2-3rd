package com.example.myteam.command;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TaskVO {
    private int taskId;
    private int userId;
    private String taskName;
    private String assignedUserName;
    private String status;
    private boolean isCompleted;
}