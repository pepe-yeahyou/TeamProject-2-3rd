package com.example.myteam.command;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProjectVO {
    private Integer ProjectID;
    private Integer OwnerID;
    private String ProjectTitle;
    private String Description;
    private LocalDate StartDate;
    private LocalDate EndDate;
    private LocalDateTime CreateAt;
    private LocalDateTime UpdateAt;
}