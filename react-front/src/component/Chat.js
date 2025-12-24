import React, { Fragment, useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs"; // STOMP 클라이언트 사용
import '../css/chat.css';
import api, { chatURL } from '../api/axios';


function Chat({ projectId, isChatEnabled, currentUser }) {
    
    // --- 1. 상태 및 Ref 정의 ---
    const [message, setMessage] = useState(''); 
    const [messageList, setMessageList] = useState([]); 
    const messagesEndRef = useRef(null); 
    const [isConnected, setIsConnected] = useState(false); 
    const stompClientRef = useRef(null); // STOMP 클라이언트 객체 저장

    // 메시지 리스트가 업데이트될 때마다 스크롤을 맨 아래로 내림
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messageList]);


    // --- 2. 소켓 연결 및 이벤트 리스너 설정 ---
    useEffect(() => {
        // 채팅 비활성화 시 연결 해제
        if (!isChatEnabled) {
            if (stompClientRef.current) {
                stompClientRef.current.deactivate();
                stompClientRef.current = null;
            }
            setIsConnected(false);
            return;
        }

        // 🚨 [중복 방지] 이미 연결되어 있거나 활성화된 클라이언트가 있으면 새로 만들지 않음
        if (stompClientRef.current && stompClientRef.current.active) {
            return;
        }

        const token = "TEST_DUMMY_TOKEN_EXISTS"; 
        
        // SockJS 및 STOMP 설정
        const socket = new SockJS(`${chatURL}?projectId=${projectId}&token=${token}`);
        const stompClient = new Client({
            webSocketFactory: () => socket,
            reconnectDelay: 5000,
            
            onConnect: () => {
                console.log(`[SUCCESS] STOMP 연결 성공: (Project ID: ${projectId})`);
                setIsConnected(true);
                
                // 메시지 구독 (STOMP SUBSCRIBE)
                stompClient.subscribe(`/sub/projects/${projectId}`, (frame) => {
                    try {
                        const payload = JSON.parse(frame.body);
                        
                        // 서버의 projectId(Number)와 프론트의 projectId(String일 확률 높음) 비교를 위해 String 변환
                        const isMatch = String(payload.projectId) === String(projectId);
                        
                        if (['TALK', 'ENTER', 'QUIT'].includes(payload.type) && isMatch) {
                            
                            // 서버 필드명을 클라이언트 렌더링용 필드명으로 매핑
                            const displayPayload = {
                                ...payload,
                                message: payload.messageContent, // 렌더링: msg.message
                                createdAt: payload.timestamp     // 렌더링: msg.createdAt
                            };
                            
                            setMessageList(prev => {
                                // 🚨 [중복 방지] 마지막 메시지와 동일한 데이터(내용+시간+작성자)가 들어오면 무시
                                if (prev.length > 0) {
                                    const last = prev[prev.length - 1];
                                    if (last.messageContent === payload.messageContent && 
                                        last.timestamp === payload.timestamp && 
                                        last.senderId === payload.senderId) {
                                        return prev;
                                    }
                                }
                                
                                const newList = [...prev, displayPayload];
                                if (newList.length > 200) { newList.shift(); }
                                return newList;
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
        
        stompClient.activate(); 
        stompClientRef.current = stompClient;

        // 컴포넌트 unmount 시 클린업
        return () => {
            if (stompClientRef.current) {
                stompClientRef.current.deactivate();
                stompClientRef.current = null;
            }
            setIsConnected(false);
        }

    // 🚨 [중복 방지 핵심] 의존성 배열에서 currentUser 정보는 뺀다. 
    // projectId나 채팅 활성화 여부가 바뀔 때만 새로 연결한다.
    }, [projectId, isChatEnabled]);

    useEffect(() => {
    if (!isChatEnabled) return;

    // --- 초기 메시지 10개 가져오기 ---
    api.get(`${chatURL}/${projectId}/recent`)
        .then(res => {
            // 메시지 포맷 변환
            const initialMessages = res.data.map(msg => ({
                ...msg,
                message: msg.messageContent,
                createdAt: msg.timestamp
            }));
            setMessageList(initialMessages);
        })
        .catch(err => console.error("초기 메시지 로딩 실패:", err));

}, [projectId, isChatEnabled]);



    // --- 3. 메시지 전송 로직 ---
    const sendMessage = () => {
        if (message.trim() === '' || !isConnected || !stompClientRef.current) {
            return;
        }
        
        // 입력값 정리
        let cleanedInputMessage = message.trim();
        const logPattern = /^\/\/[^\s]+(오전|오후)\s\d{1,2}:\d{2}:\d{2}\s*/g;
        cleanedInputMessage = cleanedInputMessage.replace(logPattern, '').trim();
        cleanedInputMessage = cleanedInputMessage.replace(/\[nbsp\]|&nbsp;/g, ' ').trim();

        const messagePayload = {
            type: 'TALK',
            projectId: projectId,
            senderId: currentUser.userId,
            displayName: currentUser.displayName,
            messageContent: cleanedInputMessage,
            timestamp: new Date().toISOString()
        };

        // 서버로 PUBLISH (여기서 setMessageList를 직접 호출하지 않는다!)
        // 서버가 브로드캐스팅해주는 것을 subscribe 채널에서 받아서 처리한다.
        stompClientRef.current.publish({
            destination: `/pub/chat/${projectId}`,
            body: JSON.stringify(messagePayload),
            headers: {}
        });
        
        setMessage(''); // 입력창만 초기화
    }

    const sendMessageEnter = e => {
        if (e.key === 'Enter') {
            e.preventDefault(); 
            sendMessage();
        }
    }
    
    // --- 4. 렌더링 ---
    if (!isChatEnabled) {
        return (
             <div className="text-center p-4 border rounded bg-gray-100 text-gray-600">
                 프로젝트가 종료되었거나 채팅 권한이 없습니다.
             </div>
        );
    }

    return (
        <div className="chat-section-content"> 
            
            <div className="chat-connection-status">
                <p className={isConnected ? 'status-connected' : 'status-connecting'}>
                    {isConnected ? '✅ 실시간 연결됨' : '⚠️ 서버 연결 중...'}
                </p>
            </div>

            <div className="chat-messages">
                {
                    messageList.map((msg, index) => {
                        // senderId 비교 시 타입 불일치 방지를 위해 String 변환
                        const isMyMessage = String(msg.senderId) === String(currentUser.userId);
                        const time = msg.createdAt 
                            ? new Date(msg.createdAt).toLocaleTimeString('ko-KR', {hour: '2-digit', minute: '2-digit'}) 
                            : "";

                        return (
                            <div 
                                key={index}
                                className={`chat-message ${isMyMessage ? 'me' : 'other'}`}
                            >
                                <div className="chat-bubble-container">
                                    <div className="chat-sender-info">
                                        <strong className="chat-sender">{msg.displayName}</strong>
                                        <span className="chat-time-inline">{time}</span> 
                                    </div>
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

            <div className="chat-input-container">
                <input
                    type="text"
                    placeholder="메시지를 입력하세요"
                    className="chat-input"
                    onChange={e => setMessage(e.target.value)}
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