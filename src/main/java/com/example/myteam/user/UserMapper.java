package com.example.myteam.user;

import com.example.myteam.command.UserVO;
import org.apache.ibatis.annotations.Param;

import java.util.Optional;

public interface UserMapper {
    void insertUser(UserVO user);
    Optional<UserVO> findByUsername(@Param("username") String username);
    boolean existsByUsername(@Param("username") String username);
    Optional<UserVO> findByUserId(@Param("userId") Long userId);
}
