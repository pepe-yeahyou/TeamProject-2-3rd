package com.example.myteam.service;

import com.example.myteam.command.DetailVO;
import com.example.myteam.command.FileVO;
import com.example.myteam.command.UpdateVO;

import java.util.Optional;

public interface DetailService {

    // 프로젝트 상세 정보 조회
    DetailVO getProjectDetail(Long projectId);

    // 프로젝트 수정 (제목, 내용 등 수정)
    void updateProject(Long projectId, UpdateVO request, Long currentUserId);

    // 프로젝트 삭제 (작성자만 가능)
    void deleteProject(Long projectId, Long currentUserId);

    // 작업 상태 변경 (Task ID, 완료/진행 중, 권한 체크 포함)
    void updateTaskStatus(Long taskId, boolean isCompleted, Long currentUserId);

    Optional<FileVO> getFileInfoById(Long fileId);
}