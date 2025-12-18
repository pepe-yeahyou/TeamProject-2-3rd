package com.example.myteam.controller;

import com.example.myteam.command.DashboardSummaryVO;
import com.example.myteam.command.ProjectSummaryVO;
import com.example.myteam.user.DashboardService;
import com.example.myteam.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;
    private final UserService userService; // 사용자 ID 조회를 위한 서비스

    // 현재 로그인된 사용자의 ID를 Security Context에서 추출
    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        // SecurityContext에 저장된 Username을 가져옴
        String username = authentication.getName();

        // 현재는 편의상 UserService를 통해 ID를 조회한다고 가정
        return userService.getUserIdByUsername(username);
    }

    // GET /api/dashboard/summary (대시보드 요약)
    @GetMapping("/summary")
    public ResponseEntity<DashboardSummaryVO> getSummary() {
        Long userId = getCurrentUserId();
        DashboardSummaryVO summary = dashboardService.getDashboardSummary(userId);
        return ResponseEntity.ok(summary);
    }

    // GET /api/dashboard/projects (프로젝트 목록 및 진척도)
    @GetMapping("/projects")
    public ResponseEntity<List<ProjectSummaryVO>> getProjects() {
        Long userId = getCurrentUserId();
        List<ProjectSummaryVO> projects = dashboardService.getProjectSummaries(userId);
        return ResponseEntity.ok(projects);
    }

    // 대시보드에 username 표시
    @GetMapping("username")
    public ResponseEntity<String> getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        String username = authentication.getName();
        String userName = userService.getNameByUserName(username);

        if (userName == null) {
            return ResponseEntity.ok("사용자");
        }

        return ResponseEntity.ok(userName);
    }
}