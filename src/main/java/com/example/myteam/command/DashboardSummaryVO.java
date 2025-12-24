package com.example.myteam.command;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = false)
public class DashboardSummaryVO {
    private int totalProjects;
    private int inProgressCount;
    private int completedCount;
}
