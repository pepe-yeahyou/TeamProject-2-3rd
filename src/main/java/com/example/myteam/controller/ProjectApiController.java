package com.example.myteam.controller;

import com.example.myteam.command.ProjectCreateVO;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000")
public class ProjectApiController {

    @PostMapping("/projects")
    public ResponseEntity<Map<String, Object>> createProject(@RequestBody ProjectCreateVO projectCreateVO) {
        System.out.println("🎯 맵으로 받은 데이터:");
        System.out.println("- 전체: " + projectCreateVO);
        System.out.println("- name 필드: " + projectCreateVO.getProjectTitle());
        System.out.println("- invitedUserIds: " + projectCreateVO.getInvitedUserIds());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "프로젝트 생성이 완료되었습니다.");
        response.put("projectId", 123); // 실제 생성된 프로젝트 ID
        return ResponseEntity.ok(response);
    }

    @GetMapping("/users/search")
    public List<Map<String, Object>> searchUsers(@RequestParam String q) {
        System.out.println("사용자 검색: " + q);

        List<Map<String, Object>> users = new ArrayList<>();

        // 더미 데이터
        users.add(createUser(1, "kim", "김철수", "kim@email.com"));
        users.add(createUser(2, "lee", "이영희", "lee@email.com"));
        users.add(createUser(3, "park", "박지훈", "park@email.com"));

        return users;
    }

    private Map<String, Object> createUser(int id, String username, String displayName, String email) {
        Map<String, Object> user = new HashMap<>();
        user.put("userId", id);
        user.put("username", username);
        user.put("displayName", displayName);
        user.put("email", email);
        return user;
    }
}