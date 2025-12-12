// src/main/java/com/example/myteam/service/DashboardService.java

package com.example.myteam.user;

import com.example.myteam.command.DashboardSummaryVO;
import com.example.myteam.command.ProjectSummaryDTO;
import com.example.myteam.command.ProjectSummaryVO;
import com.example.myteam.mapper.ProjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ProjectMapper projectMapper;

    // 1. 프로젝트 목록 조회 및 진척도 계산
    public List<ProjectSummaryDTO> getProjectSummaries(Long userId) {
        List<ProjectSummaryVO> vos = projectMapper.findProjectsAndTaskCountsByUserId(userId);

        return vos.stream().map(vo -> {
            ProjectSummaryDTO dto = new ProjectSummaryDTO();

            // 기본 매핑
            dto.setProjectId(vo.getProjectId());
            dto.setTitle(vo.getTitle());
            dto.setStartDate(vo.getStartDate());
            dto.setEndDate(vo.getEndDate());

            // 담당자 이름 (Mapper 쿼리에서 가져온 필드 사용 가정)
            dto.setManagerName(vo.getManagerName());

            // 진척도 계산 로직 (Task 완료 기반)
            int total = vo.getTotalTasks();
            int completed = vo.getCompletedTasks();
            int progressRate = (total > 0) ? (int) Math.round(((double) completed / total) * 100) : 0;

            dto.setProgressRate(progressRate);
            dto.setStatus(progressRate == 100 ? "완료" : "진행 중");

            // 협업자 이름 목록 조회 (추가 쿼리 호출)
            List<String> coWorkerNames = projectMapper.findCoWorkerNamesByProjectId(vo.getProjectId());
            dto.setCoWorkerNames(coWorkerNames);

            return dto;
        }).collect(Collectors.toList());
    }

    // 2. 대시보드 요약 정보 조회
    public DashboardSummaryVO getDashboardSummary(Long userId) {
        // Mapper에서 바로 DTO에 매핑되는 VO를 반환한다고 가정
        return projectMapper.getDashboardSummaryByUserId(userId);
    }
}