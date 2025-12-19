package com.example.myteam.command;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ChatVO {

    private Integer projectId;
    private Integer senderId;

    // 🚨 프론트에서 displayName으로 보내므로 백엔드 DTO에서도 받아줘야 함
    private String senderName;
    private String displayName; // 👈 추가: 프론트의 currentUser.displayName을 받는 필드

    private String messageContent;
    private MessageType type;
    private LocalDateTime timestamp;

    public ChatVO() {
        this.timestamp = LocalDateTime.now();
    }

    // 필드 추가에 따른 생성자 (필요 시)
    public ChatVO(Integer projectId, Integer senderId, String senderName, String displayName, String messageContent, MessageType type) {
        this.projectId = projectId;
        this.senderId = senderId;
        this.senderName = senderName;
        this.displayName = displayName; // 👈 추가
        this.messageContent = messageContent;
        this.type = type;
        this.timestamp = LocalDateTime.now();
    }

    public enum MessageType {
        ENTER, TALK, QUIT
    }
}