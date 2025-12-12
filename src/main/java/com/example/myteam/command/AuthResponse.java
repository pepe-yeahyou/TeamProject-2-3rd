package com.example.myteam.command;

import lombok.Data;

@Data
public class AuthResponse {
    private String token;
    private String displayName; //로그인 성공시 표시되는 사용자명
}
