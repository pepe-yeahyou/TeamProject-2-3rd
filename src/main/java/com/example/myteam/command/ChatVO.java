package com.example.myteam.command;

import lombok.Data; // Lombok import 추가
import java.time.LocalDateTime;

@Data
public class ChatVO {

    // 1. 메시지 발송 관련 정보
    private Integer projectId;
    private Integer senderId;
    private String senderName;

    // 2. 메시지 내용 및 형식
    private String messageContent;
    private MessageType type;

    // 3. 시간 정보
    private LocalDateTime timestamp;

    // -- Constructors --

    public ChatVO() {
        this.timestamp = LocalDateTime.now(); // 기본 생성 시 시간 자동 설정
    }

    public ChatVO(Integer projectId, Integer senderId, String senderName, String messageContent, MessageType type) {
        this.projectId = projectId;
        this.senderId = senderId;
        this.senderName = senderName;
        this.messageContent = messageContent;
        this.type = type;
        this.timestamp = LocalDateTime.now();
    }

    // ENUM MessageType 정의
    public enum MessageType {
        ENTER,   // 사용자 입장
        TALK,    // 일반 채팅 메시지
        QUIT     // 사용자 퇴장
    }

}