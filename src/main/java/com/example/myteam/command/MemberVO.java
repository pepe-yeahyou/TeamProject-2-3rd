package com.example.myteam.command;


import lombok.Builder;
import lombok.Data; // @Data 사용
import java.time.LocalDateTime;

@Data
@Builder
public class MemberVO {
    private Long userId;
    private String displayName;
    private boolean isLeader;
    private LocalDateTime joinedAt;
}