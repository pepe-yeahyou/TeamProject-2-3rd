package com.example.myteam.command;

import lombok.Data;

@Data
public class TaskCreateVO {
    private String taskName;
    private String description;
    private Integer assignedUserId;
}
