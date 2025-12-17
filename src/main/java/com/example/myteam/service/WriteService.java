package com.example.myteam.service;

import com.example.myteam.command.WriteVO;
import com.example.myteam.command.ProjectVO;
import com.example.myteam.command.UserVO;

import java.util.List;

public interface WriteService {

    /**
     * 프로젝트 생성 메인 메서드
     * @param writeVO 프로젝트 생성에 필요한 모든 데이터
     * @param currentUserId 현재 로그인한 사용자 ID (프로젝트 소유자)
     * @return 생성된 프로젝트의 ID
     */
    Integer createProject(WriteVO writeVO, Integer currentUserId);

    /**
     * 사용자 검색 (이름 또는 사용자명으로)
     * @param query 검색어
     * @return 검색된 사용자 목록
     */
    List<UserVO> searchUsers(String query);

    /**
     * 프로젝트 상세 정보 조회
     * @param projectId 프로젝트 ID
     * @return 프로젝트 상세 정보
     */
    ProjectVO getProjectById(Integer projectId);
}