package com.example.myteam.command;

import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class WriteVO_disable {
    private String projectTitle;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
    private List<Integer> invitedUserIds;
    private List<TaskCreateVO> initialTasks;
}
