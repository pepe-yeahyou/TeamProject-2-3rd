package com.example.myteam.command;

import lombok.Data;

@Data
public class RegisterRequest {
    private String username;
    private String password;
    private String displayName;
}
