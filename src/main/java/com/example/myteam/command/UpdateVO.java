package com.example.myteam.command;

import lombok.Data;

import java.time.LocalDate;

@Data // @Getter, @Setter 등을 대체
public class UpdateVO {
    // --- 프로젝트 수정을 위해 추가하는 필드 ---
    private String projectTitle;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
}