package com.example.myteam.command;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UserVO {
    private Long userId;          // USER_ID
    private String username;      // USERNAME
    private String passwordHash;  // PASSWORD_HASH
    private String displayName;   // DISPLAY_NAME
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
