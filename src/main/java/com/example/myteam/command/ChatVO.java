package com.example.myteam.command;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ChatVO {
    private Integer projectId;
    private Integer senderId;
    private String senderName;
    private String displayName;
    private String messageContent;
    private MessageType type;
    private LocalDateTime timestamp;

    public ChatVO() {
        this.timestamp = LocalDateTime.now();
    }

    public enum MessageType {
        ENTER, TALK, QUIT
    }
}