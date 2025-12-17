package com.example.myteam.command;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class MemberVO {
    private Integer memberId;
    private Integer projectId;
    private Integer userId;
    private Boolean isLeader;
    private LocalDateTime joinedAt;
}
