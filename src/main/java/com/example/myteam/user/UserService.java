package com.example.myteam.user;

import com.example.myteam.command.UserVO;
import org.springframework.stereotype.Service;

@Service
public interface UserService {

    // 1. 회원가입
    UserVO registerUser(String username, String password, String displayName);

    // 2. 로그인 인증 (UserServiceImpl과 이름이 일치해야 함)
    UserVO authenticate(String username, String password);

    // 3. 사용자 ID 조회
    Long getUserIdByUsername(String username);

    // 4. 사용자 이름 조회
    String getNameByUserName(String username);
}
