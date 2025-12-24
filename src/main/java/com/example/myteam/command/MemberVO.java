package com.example.myteam.command;

import lombok.AllArgsConstructor;
import lombok.Builder; // 추가
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder // 이거 넣어라
public class MemberVO {
    private int userId;
    private String displayName;
    private boolean isLeader;
    private LocalDateTime joinedAt;
}