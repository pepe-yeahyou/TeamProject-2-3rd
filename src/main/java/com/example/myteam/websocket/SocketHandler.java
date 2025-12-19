package com.example.myteam.websocket;

import com.example.myteam.command.ChatVO; // ChatVO DTO/VO 경로
import com.example.myteam.command.ChatVO.MessageType; // MessageType Enum 사용을 위해 내부 클래스 직접 임포트
import com.example.myteam.entity.Chat; // DB 저장을 위한 Entity
import com.example.myteam.service.ChatService; // 🚨 ChatService import 추가

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.time.LocalDateTime;

/**
 * WebSocket 메시지 핸들러 (STOMP Protocol 사용)
 * ChatService를 주입받아 메시지를 DB에 트랜잭션 단위로 저장합니다.
 * /pub/chat/{projectId} 요청을 처리하고, /topic/projects/{projectId}로 브로드캐스팅합니다.
 */

@Controller
public class SocketHandler {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatService chatService; // 🚨 ChatService 필드 추가

    public SocketHandler(SimpMessagingTemplate messagingTemplate, ChatService chatService) {
        this.messagingTemplate = messagingTemplate;
        this.chatService = chatService; // 🚨 Service 객체 주입
    }

    @MessageMapping("/chat/{projectId}")
    public void handleChatMessage(
            @DestinationVariable Integer projectId,
            ChatVO message) {

        message.setProjectId(projectId);

        // 🚨 프론트에서 displayName을 보냈는데 senderName이 비어있을 경우를 대비한 보정
        if (message.getSenderName() == null) {
            message.setSenderName(message.getDisplayName());
        }

        if (message.getTimestamp() == null) {
            message.setTimestamp(LocalDateTime.now());
        }

        // 입장/퇴장 메시지 처리 시에도 displayName(또는 senderName) 사용
        if (message.getType() == MessageType.ENTER) {
            message.setMessageContent(message.getSenderName() + "님이 입장했습니다.");
        } else if (message.getType() == MessageType.QUIT) {
            message.setMessageContent(message.getSenderName() + "님이 퇴장했습니다.");
        }

        // DB 저장용 Entity 생성 (기존 유지)
        Chat chatEntity = new Chat(
                message.getProjectId(),
                message.getSenderId(),
                message.getSenderName(), // DB의 Transient 필드 혹은 로그용
                message.getMessageContent(),
                message.getType()
        );

        chatService.saveChatMessage(chatEntity);

        // 🚨 중요: 다시 프론트로 보낼 때 message 객체에 senderName(displayName)이 담겨 있어야 함
        // 프론트 구독 경로: /sub/projects/{projectId} (WebSocketConfig 설정 기준)
        messagingTemplate.convertAndSend("/sub/projects/" + projectId, message);

        // **로그 확인용**
        //System.out.println("[DB SAVE SUCCESS] Chat saved: ID=" + savedChat.getId() + ", Content=" + savedChat.getMessageContent());

        System.out.println("🚨 [DEBUG BEFORE SAVE]");
        System.out.println("ID: " + chatEntity.getId()); // null (AUTO_INCREMENT)
        System.out.println("PROJECT_ID (INT): " + chatEntity.getProjectId());
        System.out.println("USER_ID (INT): " + chatEntity.getSenderId());
        System.out.println("CONTENT: " + chatEntity.getMessageContent());
        System.out.println("TIMESTAMP: " + chatEntity.getTimestamp());
        System.out.println("🚨 [DEBUG BEFORE SAVE] (END)");

        messagingTemplate.convertAndSend("/topic/projects/" + projectId, message);
    }
}