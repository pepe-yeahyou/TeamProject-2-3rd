package com.example.myteam.service;

import com.example.myteam.entity.Chat;
import com.example.myteam.repository.ChatRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ChatService {

    private final ChatRepository chatRepository;

    public ChatService(ChatRepository chatRepository) {
        this.chatRepository = chatRepository;
    }

    @Transactional
    public Chat saveChatMessage(Chat chatEntity) {
        return chatRepository.save(chatEntity);
    }

    // 최근 10개 메시지 조회
    @Transactional(readOnly = true)
    public List<Chat> getLastChats(Integer projectId) {
        return chatRepository.findLastChatsByProjectId(projectId, PageRequest.of(0, 10));
    }
}
