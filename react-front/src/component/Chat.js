// src/component/Chat.js

import React, { Fragment, useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs"; // STOMP 클라이언트 사용


// 백엔드 SocketHandler가 SockJS를 처리하는 엔드포인트
const WS_BASE_URL = 'http://localhost:8484/api/chat';

function Chat( {projectId, isChatEnabled, currentUser} ) {
    
    // --- 1. 상태 및 Ref 정의 ---
    // 기존 socketRef는 STOMP 클라이언트가 대체합니다.
    const [message, setMessage]=useState(''); 
    const [messageList,setMessageList]=useState([]); 
    const messagesEndRef = useRef(null); 
    const [isConnected, setIsConnected] = useState(false); 
    const stompClientRef = useRef(null); // STOMP 클라이언트 객체 저장

    // 메시지 리스트가 업데이트될 때마다 스크롤을 맨 아래로 내림
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messageList]);


    // --- 2. 소켓 연결 및 이벤트 리스너 설정 (STOMP 적용) ---
    useEffect( () => {
        if (!isChatEnabled) {
            // 비활성화 시 기존 STOMP 연결 해제
            if (stompClientRef.current) stompClientRef.current.deactivate();
            setIsConnected(false);
            return;
        }

        const token = "TEST_DUMMY_TOKEN_EXISTS"; 
        setIsConnected(false); 

        // 1. SockJS 객체 생성 (STOMP에 주입될 WebSocket 추상화)
        const socket = new SockJS(`${WS_BASE_URL}?projectId=${projectId}&token=${token}`);
        
        // 2. STOMP 클라이언트 생성 및 SockJS 객체 주입
        const stompClient = new Client({
            webSocketFactory: () => socket, // SockJS 객체를 STOMP에 주입
            reconnectDelay: 5000,
            
            onConnect: () => {
                console.log(`[SUCCESS] STOMP 연결 성공: (Project ID: ${projectId})`);
                setIsConnected(true);
                
                // 3. 메시지 구독 (STOMP SUBSCRIBE)
                // 서버 브로드캐스트 경로: /sub/projects/{projectId}
                stompClient.subscribe(`/sub/projects/${projectId}`, (frame) => {
                    try {
                        const payload = JSON.parse(frame.body); // STOMP 메시지는 frame.body에 있음
                        
                        // 서버의 ChatVO Enum Type과 일치하는지 확인
                        if(['TALK', 'ENTER', 'QUIT'].includes(payload.type) && payload.projectId === projectId){
                            
                            // 서버 필드명(messageContent, timestamp)을 클라이언트 렌더링 필드명(message, createdAt)으로 매핑
                            const displayPayload = {
                                ...payload,
                                message: payload.messageContent, // 렌더링을 위해 필드명 변환
                                createdAt: payload.timestamp      // 렌더링을 위해 필드명 변환
                            };
                            
                            setMessageList(prev => {
                                if(prev.length > 200){ prev.shift(); }
                                return [...prev, displayPayload]; 
                            });
                        }
                    } catch (error) {
                        console.error("STOMP 메시지 수신/파싱 오류:", error);
                    }
                });
            },
            onStompError: (frame) => {
                console.error('[ERROR] STOMP 에러:', frame);
                setIsConnected(false);
            },
            onWebSocketClose: () => {
                console.log('[CLOSE] WebSocket 연결 해제됨.');
                setIsConnected(false);
            }
        });
        
        stompClientRef.current = stompClient;
        stompClient.activate(); // STOMP 연결 시작

        // 7. 컴포넌트 unmount 시 실행
        return () => {
            if (stompClientRef.current) {
                stompClientRef.current.deactivate(); // STOMP 연결 해제
                stompClientRef.current = null;
            }
            setIsConnected(false);
        }

    }, [projectId, isChatEnabled, currentUser.userId, currentUser.userName]);


    // --- 3. 메시지 전송 로직 (STOMP 적용) ---
    const sendMessage = () => {
        if (message.trim() === '' || !isConnected || !stompClientRef.current) {
            return;
        }
        
        // 메시지 클리닝 (기존 로직 유지)
        let cleanedInputMessage = message.trim();
        const logPattern = /^\/\/[^\s]+(오전|오후)\s\d{1,2}:\d{2}:\d{2}\s*/g;
        cleanedInputMessage = cleanedInputMessage.replace(logPattern, '').trim();
        cleanedInputMessage = cleanedInputMessage.replace(/\[nbsp\]/g, ' ');
        cleanedInputMessage = cleanedInputMessage.replace(/&nbsp;/g, ' ');
        cleanedInputMessage = cleanedInputMessage.trim();


        // 서버의 ChatVO 필드명과 일치하도록 메시지 페이로드 구성
        const messagePayload = {
            type: 'TALK',
            projectId: projectId,
            senderId: currentUser.userId,
            displayName: currentUser.displayName, // 🚨 주신 UserVO/ChatVO에 있는 displayName을 추가!
            messageContent: cleanedInputMessage,
            timestamp: new Date().toISOString()
        };

        // 1. 서버로 STOMP PUBLISH 전송
        stompClientRef.current.publish({
            destination: `/pub/chat/${projectId}`, // 서버의 MessageMapping 경로와 일치
            body: JSON.stringify(messagePayload),
            headers: {}
        });
        
        // 2. 자신이 보낸 메시지를 즉시 messageList에 추가 (낙관적 업데이트)
        // 렌더링에 필요한 필드명으로 변환
        const displayPayload = {
            ...messagePayload,
            message: messagePayload.messageContent,
            createdAt: messagePayload.timestamp 
        };
        
        setMessageList(prev => {
            if (prev.length > 200) { prev.shift(); }
            return [...prev, displayPayload]; 
        });
        
        setMessage(''); // input 초기화
    }

    const sendMessageEnter = e => {
        if(e.key === 'Enter'){
            e.preventDefault(); 
            sendMessage();
        }
    }
    
    // --- 4. 렌더링 (기존과 동일) ---
    if (!isChatEnabled) {
        return (
             <div className="text-center p-4 border rounded bg-gray-100 text-gray-600">
                 프로젝트가 종료되었거나, 해당 프로젝트의 담당자/협업자가 아니므로 채팅이 비활성화되었습니다.
             </div>
        );
    }


    return (
        <div className="chat-section-content"> 
            
            {/* 소켓 연결 상태 표시 */}
            <div className="chat-connection-status">
                <p className={isConnected ? 'status-connected' : 'status-connecting'}>
                    {isConnected ? '✅ 소켓 연결 완료. 메시지를 입력하세요.' : '⚠️ 서버 연결 중... 잠시 기다리거나 콘솔을 확인하세요.'}
                </p>
            </div>

            {/* 메시지 리스트 컨테이너 */}
            <div className="chat-messages">
                {
                    messageList.map((msg, index) => {
                        const isMyMessage = msg.senderId === currentUser.userId;
                        const time = msg.createdAt 
                            ? new Date(msg.createdAt).toLocaleTimeString('ko-KR', {hour: '2-digit', minute: '2-digit'}) 
                            : new Date().toLocaleTimeString('ko-KR', {hour: '2-digit', minute: '2-digit'});

                        return (
                            <div 
                                key={index}
                                className={`chat-message ${isMyMessage ? 'me' : 'other'}`}
                            >
                                <div className="chat-bubble-container">
                                    
                                    {/* 이름과 시간 */}
                                    <div className="chat-sender-info">
                                        <strong className="chat-sender">{msg.displayName}</strong>
                                        <span className="chat-time-inline">{time}</span> 
                                    </div>

                                    {/* 메시지 버블 */}
                                    <div className="chat-bubble">
                                        {msg.message}
                                    </div>
                                </div>
                            </div>
                        )
                    })
                }
                <div ref={messagesEndRef} />
            </div>

            {/* 채팅 입력창 */}
            <div className="chat-input-container">
                <input
                    type="text"
                    placeholder="메시지를 입력하세요"
                    className="chat-input"
                    onChange={e=>setMessage(e.target.value)}
                    value={message}
                    onKeyUp={sendMessageEnter}
                    disabled={!isConnected} 
                />
                <button className="chat-send-button"
                    onClick={sendMessage}
                    disabled={!isConnected || message.trim() === ''} 
                        >
                        <span>▶</span>
                </button>
            </div>
        </div>
    )
}

export default Chat;