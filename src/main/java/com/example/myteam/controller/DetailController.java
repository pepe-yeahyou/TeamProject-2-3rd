package com.example.myteam.controller;

import com.example.myteam.service.DetailService;
import com.example.myteam.command.DetailVO; // ProjectDetailVO -> DetailVO
import com.example.myteam.command.UpdateVO; // ProjectUpdateRequest -> UpdateVO
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/detail")
@CrossOrigin(origins = "http://localhost:3000")
public class DetailController {

    private final DetailService detailService;

    @Autowired
    public DetailController(DetailService detailService) {
        this.detailService = detailService;
    }

    // ---------------------- 1. 프로젝트 상세 정보 조회 API ----------------------

    /**
     * [API] 프로젝트 상세 정보 조회 (GET /detail/{projectId})
     */
    @GetMapping("/{projectId}")
    public ResponseEntity<DetailVO> getProjectDetail(@PathVariable Long projectId) {
        DetailVO detail = detailService.getProjectDetail(projectId);
        return ResponseEntity.ok(detail);
    }

    // ---------------------- 2. 프로젝트 수정/삭제 API ----------------------

    // 임시 사용자 ID 획득 메서드 (Security 구현 시 대체 필요)
    private Long getCurrentUserIdFromContext() {
        // 실제로는 Spring Security를 통해 인증된 사용자 ID를 반환해야 합니다.
        // 이 ID는 수정/삭제 권한 체크 (작성자 여부 확인)에 사용됩니다.
        return 1L;
    }
    /**
     * [API] 프로젝트 수정/삭제 처리 (POST /detail/{projectId})
     * - 수정: Body에 UpdateVO 포함
     * - 삭제: Query Param 'operation=DELETE' 사용
     */
    @PostMapping("/{projectId}")
    public ResponseEntity<String> handleProjectModification(
            @PathVariable Long projectId,
            // @RequestBody(required = false)로 설정하여 수정 데이터가 없으면 삭제 요청으로 간주
            @RequestBody(required = false) UpdateVO request,
            @RequestParam(required = false) String operation) {

        Long currentUserId = getCurrentUserIdFromContext();

        if ("DELETE".equalsIgnoreCase(operation)) {
            // 프로젝트 삭제 (권한 체크는 Service 계층에서 수행)
            detailService.deleteProject(projectId, currentUserId);
            return ResponseEntity.ok("Project ID " + projectId + " has been successfully deleted.");
        }

        if (request != null) {
            // 프로젝트 수정 (권한 체크는 Service 계층에서 수행)
            detailService.updateProject(projectId, request, currentUserId);
            return ResponseEntity.ok("Project ID " + projectId + " has been successfully updated.");
        }

        return ResponseEntity.badRequest().body("Invalid request. Specify operation=DELETE or provide update data.");
    }

    // ---------------------- 3. 작업 목록 및 상태 변경 API ----------------------

    /**
     * 작업 상태 변경 (Task ID, 완료/진행 중 처리)
     * POST /detail/{projectId}/task/{taskId}?isCompleted={true/false}
     */
    @PostMapping("/{projectId}/task/{taskId}")
    public ResponseEntity<String> updateTaskStatus(
            @PathVariable Long projectId,
            @PathVariable Long taskId,
            @RequestParam boolean isCompleted) {

        Long currentUserId = getCurrentUserIdFromContext();

        // Task 상태 변경 (권한 체크는 Service 계층에서 수행)
        detailService.updateTaskStatus(taskId, isCompleted, currentUserId);

        return ResponseEntity.ok("Task ID " + taskId + " status updated successfully.");
    }

    // ---------------------- 4. 채팅 WebSocket 연결 (HTTP 핸드셰이크) ----------------------

    /**
     * WebSocket 연결 시작을 위한 엔드포인트 (실제 WS 연결은 WebSocketConfig에서 처리)
     * GET /detail/{projectId}/websocket?room={}&token={}
     */
    @GetMapping("/{projectId}/websocket")
    public ResponseEntity<String> startWebSocketConnection(@PathVariable Long projectId) {
        // 이 HTTP 엔드포인트는 클라이언트에게 WebSocket 연결 경로를 안내하거나,
        // 권한 체크 후 실제 WS 연결은 Spring의 WebSocketConfig/Handler가 처리합니다.
        return ResponseEntity.ok("Initiating WebSocket connection for project " + projectId);
    }
}