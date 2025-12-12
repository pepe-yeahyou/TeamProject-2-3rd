package com.example.myteam.command;

import java.time.LocalDate;

public class ProjectSummaryVO {
    private Long projectId;
    private String title;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
    private String managerName;
    private int totalTasks;
    private int completedTasks;
}
