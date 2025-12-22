package com.example.myteam.command;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class UpdateVO {
    private String projectTitle;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
    private List<MemberUpdateDTO> memberList;
    private List<TaskUpdateDTO> taskList;
    @Data
    public static class MemberUpdateDTO {
        private Long userId;
    }
    @Data
    public static class TaskUpdateDTO {
        private String taskName;
        private Long userId;
    }
}