package com.example.myteam.websocket;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker // STOMP 메시지 처리 활성화
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    /**
     * 클라이언트가 웹소켓 연결을 시작할 엔드포인트를 등록합니다.
     * http://localhost:8484/api/chat 으로 연결됩니다.
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/api/chat")
                // 프론트엔드(3000번 포트)의 접근을 명시적으로 허용하여 CORS 에러를 해결합니다.
                .setAllowedOrigins("http://172.30.1.6:3000", "http://localhost:3000")
                // SockJS를 사용하여 WebSocket을 지원하지 않는 브라우저에서도 통신 가능하게 합니다.
                .withSockJS();
    }

    /**
     * 메시지 브로커를 설정합니다.
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // 1. 메시지 구독 경로 (클라이언트가 메시지를 수신하는 경로)
        // /sub/projects/{projectId} 로 구독하면 해당 프로젝트의 메시지를 받습니다.
        registry.enableSimpleBroker("/sub");

        // 2. 메시지 발행 경로 (클라이언트가 서버로 메시지를 보내는 경로의 Prefix)
        // 클라이언트는 /pub/chat/... 경로로 메시지를 보냅니다.
        registry.setApplicationDestinationPrefixes("/pub");
    }
}