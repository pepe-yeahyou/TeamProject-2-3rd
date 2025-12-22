package com.example.myteam.command;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProjectVO {
    private int projectID;
    private int ownerID;
    private String projectTitle;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDateTime createAt;
    private LocalDateTime updateAt;

    private List<MemberVO> memberList;
    private List<TaskVO> taskList;
}