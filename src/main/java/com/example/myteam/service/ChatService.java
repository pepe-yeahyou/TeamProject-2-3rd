package com.example.myteam.service;

import com.example.myteam.entity.Chat;
import com.example.myteam.repository.ChatRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
}