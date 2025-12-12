package com.example.myteam.user;

import com.example.myteam.command.UserVO;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    //회원가입
    @Transactional
    public UserVO registerUser(String username, String password, String displayName) {
        if (userMapper.existsByUsername(username)) {
            throw new RuntimeException("이미 존재하는 사용자 이름입니다.");
        }
        UserVO user = new UserVO();
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setDisplayName(displayName);
        userMapper.insertUser(user);
        return user;
    }

    //로그인
    public UserVO authenticateUser(String username, String password) {
        UserVO user = userMapper.findByUsername(username)
                .orElseThrow( () -> new RuntimeException("아이디를 찾을 수 없습니다.") );

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new RuntimeException("비밀번호가 일치하지 않습니다.");
        }
        return user;
    }

    //컨트롤러에서 사용할 사용자 ID 조회
    public Long getUserIdByUsername(String username) {
        return userMapper.findByUsername(username)
                .orElseThrow( () -> new RuntimeException("사용자 ID를 찾을 수 없습니다.") )
                .getUserId();
    }
}
