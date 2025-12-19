package com.example.myteam.controller;

import com.example.myteam.service.DetailService;
import com.example.myteam.command.DetailVO; // ProjectDetailVO -> DetailVO
import com.example.myteam.command.UpdateVO; // ProjectUpdateRequest -> UpdateVO
import com.example.myteam.command.FileVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.core.io.Resource; // 💡 Resource import
import org.springframework.core.io.UrlResource; // 💡 UrlResource import
import org.springframework.http.HttpHeaders; // 💡 HttpHeaders import
import org.springframework.http.HttpStatus; // 💡 HttpStatus import
import org.springframework.http.MediaType; // 💡 MediaType import
import org.springframework.web.server.ResponseStatusException; // 💡 ResponseStatusException import

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Optional;

@RestController
@RequestMapping("/detail")
@CrossOrigin(origins = {"http://172.30.1.6:3000", "http://localhost:3000"})
public class DetailController {

    private final DetailService detailService;
    //private final Path fileStorageLocation = Paths.get("./uploads").toAbsolutePath().normalize();

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
    /*@PostMapping("/{projectId}")
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
    }*/
    @PostMapping("/{projectId}")
    public ResponseEntity<String> handleProjectModification(
            @PathVariable Long projectId,
            @RequestBody(required = false) UpdateVO request,
            @RequestParam(required = false) String operation) {

        Long currentUserId = 1L;

        if ("DELETE".equalsIgnoreCase(operation)) {
            detailService.deleteProject(projectId, currentUserId);
            return ResponseEntity.ok("Project Deleted.");
        }

        if (request != null) {
            // UserVO에 추가한 projectTitle 필드를 사용
            if (request.getProjectTitle() == null || request.getProjectTitle().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("제목이 비어있어 수정을 진행할 수 없습니다.");
            }

            // Service에도 UserVO를 전달하도록 수정 필요
            detailService.updateProject(projectId, request, currentUserId);
            return ResponseEntity.ok("Project Updated using UserVO.");
        }

        return ResponseEntity.badRequest().body("Invalid Request.");
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

    /*
    @GetMapping("/files/{fileId}")
    public ResponseEntity<Resource> downloadFile(@PathVariable Long fileId) {

        // 1. Service를 통해 파일 정보 (DB 데이터) 조회
        Optional<FileVO> optionalFileInfo = detailService.getFileInfoById(fileId);

        FileVO fileInfo = optionalFileInfo.orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "File ID " + fileId + " not found in database.")
        );

       try {
            // 2. 파일 시스템에서 파일을 Resource 형태로 로드
            Path filePath = this.fileStorageLocation.resolve(fileInfo.getStoragePath()).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                // 저장소에 파일이 없거나 읽을 수 없는 경우
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found on server storage: " + fileInfo.getFileName());
            }

            // 3. HTTP 응답 헤더 설정 (다운로드 파일명 설정)
            String fileName = fileInfo.getFileName();

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                    .body(resource);

        } catch (MalformedURLException e) {
            // 파일 경로가 유효하지 않은 경우
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "File path error.");
        }
    }*/
}