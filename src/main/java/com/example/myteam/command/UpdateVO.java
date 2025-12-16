package com.example.myteam.command;

import lombok.Data;

@Data // @Getter, @Setter 등을 대체
public class UpdateVO {
    private String title;
    private String description;
    private java.time.LocalDate startDate;
    private java.time.LocalDate endDate;
}