package com.example.myteam.command;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor // 기본 생성자 (JSON 파싱용)
@AllArgsConstructor // 모든 필드 생성자
public class ChatVO {
    private Integer projectId;
    private Integer senderId;
    private String senderName;
    private String displayName;
    private String messageContent;
    private MessageType type;
    private LocalDateTime timestamp;

    // 💡 JPQL 쿼리에서 사용할 전용 생성자 (Enum 제외 5개 인자)
    public ChatVO(Integer projectId, Integer senderId, String displayName,
                  String messageContent, LocalDateTime timestamp) {
        this.projectId = projectId;
        this.senderId = senderId;
        this.senderName = displayName; // senderName에도 이름 할당
        this.displayName = displayName;
        this.messageContent = messageContent;
        this.timestamp = timestamp;
        this.type = MessageType.TALK; // 💡 과거 내역은 모두 TALK 타입으로 고정
    }

    public enum MessageType {
        ENTER, TALK, QUIT
    }
}