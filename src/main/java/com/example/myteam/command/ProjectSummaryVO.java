package com.example.myteam.command;

import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class ProjectSummaryVO {
    private Long projectId;
    private String title;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
    private String managerName;
    private int totalTasks;
    private int completedTasks;
    private int progressRate;
    private String status;
    private List<String> coWorkerNames;
}
