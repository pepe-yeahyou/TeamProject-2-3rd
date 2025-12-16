package com.example.myteam.entity;

import com.example.myteam.command.ChatVO;
import lombok.Data;
import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * CHAT 테이블 DDL에 맞추어 컬럼 명칭을 강제 매핑한 엔티티
 * DDL에 없는 senderName과 type 필드는 @Transient 처리되었습니다.
 */
@Data
@Entity
@Table(name = "CHAT") // DDL에서 테이블 이름이 대문자이므로, 일치시킵니다.
public class Chat {

    // 1. ID: id -> CHAT_ID
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "CHAT_ID")
    private Integer id;

    // 2. PROJECT ID: projectId -> PROJECT_ID (Hibernate 기본 규칙을 따르지만 명시)
    @Column(name = "PROJECT_ID")
    private Integer projectId;

    // 3. SENDER ID: senderId -> USER_ID (DDL에서 발신자 ID가 USER_ID로 정의됨)
    @Column(name = "USER_ID")
    private Integer senderId;

    // 4. SENDER NAME: DDL에 senderName 컬럼이 없으므로, DB 저장 대상에서 제외
    @Transient
    private String senderName;

    // 5. MESSAGE CONTENT: messageContent -> CHAT_CONTENT
    @Column(name = "CHAT_CONTENT", length = 255) // DDL VARCHAR(255)에 맞춤
    private String messageContent;

    // 6. TYPE: DDL에 type 컬럼이 없으므로, DB 저장 대상에서 제외
    @Transient
    private ChatVO.MessageType type;

    // 7. TIMESTAMP: timestamp -> CREATED_AT
    @Column(name = "CREATED_AT")
    private LocalDateTime timestamp;

    // -- 생성자 --

    public Chat() {
        // DDL에 CREATED_AT에 기본값이 없으므로, Java에서 시간을 설정합니다.
        this.timestamp = LocalDateTime.now();
    }

    public Chat(Integer projectId, Integer senderId, String senderName, String messageContent, ChatVO.MessageType type) {
        this.projectId = projectId;
        this.senderId = senderId;
        this.senderName = senderName; // Transient
        this.messageContent = messageContent;
        this.type = type; // Transient
        this.timestamp = LocalDateTime.now(); // CREATED_AT에 저장
    }
}