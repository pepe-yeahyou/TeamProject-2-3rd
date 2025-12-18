package com.example.myteam.controller;

import com.example.myteam.command.WriteVO;
import com.example.myteam.command.ProjectVO;
import com.example.myteam.command.UserVO;
import com.example.myteam.service.WriteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000")
public class WriteController {

    private final WriteService writeService;

    @Autowired
    public WriteController(WriteService writeService) {
        this.writeService = writeService;
    }

    // 프로젝트 생성 API - Write.jsx의 handleSubmit에서 호출됨
    @PostMapping("/projects")
    public ResponseEntity<Map<String, Object>> createProject(
            @RequestBody WriteVO projectCreateVO,
            @RequestHeader("X-User-Id") Integer currentUserId) {

        // currentUserId가 null이면 예외 처리
        if (currentUserId == null) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "사용자 인증이 필요합니다.");
            return new ResponseEntity<>(errorResponse, HttpStatus.UNAUTHORIZED);
        }

        // 서비스 계층 호출
        Integer createdProjectId = writeService.createProject(projectCreateVO, currentUserId);

        // Write.jsx에서 기대하는 응답 형식
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "프로젝트가 성공적으로 생성되었습니다.");
        response.put("projectId", createdProjectId);  // Write.jsx에서 navigate(`/detail/${result.projectId}`) 사용

        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    // 프로젝트 상세 조회 API - Write.jsx의 navigate 이후 사용될 것
    @GetMapping("/projects/{id}")
    public ResponseEntity<ProjectVO> getProject(@PathVariable Integer id) {
        ProjectVO projectVO = writeService.getProjectById(id);

        if (projectVO == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        return new ResponseEntity<>(projectVO, HttpStatus.OK);
    }

    // 사용자 검색 API - Write.jsx의 handleSearch에서 호출됨
    @GetMapping("/users/search")
    public ResponseEntity<Map<String, Object>> searchUsers(
            @RequestParam String query) {  // limit 파라미터 제거

        List<UserVO> users = writeService.searchUsers(query);

        Map<String, Object> response = new HashMap<>();
        response.put("users", users);

        return ResponseEntity.ok(response);
    }

    // ✅ 새로운 API: 전체 사용자 목록 조회
    @GetMapping("/users")
    public ResponseEntity<Map<String, Object>> getAllUsers() {
        List<UserVO> users = writeService.getAllUsers();

        Map<String, Object> response = new HashMap<>();
        response.put("users", users);

        return ResponseEntity.ok(response);
    }
}