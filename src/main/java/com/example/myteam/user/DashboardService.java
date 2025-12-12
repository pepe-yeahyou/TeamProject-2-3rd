package com.example.myteam.user;

import com.example.myteam.command.DashboardSummaryVO;
import com.example.myteam.command.ProjectSummaryVO;
import com.example.myteam.project.ProjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
// public class DashboardService { // 만약 인터페이스가 없다면 이렇게 사용
public class DashboardService { // 클래스 이름이 인터페이스 이름과 동일하여 혼동 가능성 있음

    private final ProjectMapper projectMapper;
    private final UserService userService; // (DashboardController에서 사용되므로, 주입되어야 할 가능성 있음. 일단 유지)

    // 1. 프로젝트 목록 조회 및 진척도 계산
    // 반환 타입도 ProjectSummaryVO로 통일하여 DTO/VO 분리를 최소화합니다.
    public List<ProjectSummaryVO> getProjectSummaries(Long userId) {

        // 1. DB에서 원본 데이터 조회 (총 Task 수 및 완료 Task 수 포함)
        List<ProjectSummaryVO> sourceVos = projectMapper.findProjectsAndTaskCountsByUserId(userId);

        return sourceVos.stream().map(sourceVo -> {

            // 2. 가공된 데이터를 담을 객체 생성 (스트림 람다 매개변수 충돌 해결)
            ProjectSummaryVO resultVo = sourceVo; // 🚨 DB에서 가져온 객체(sourceVo)를 바로 사용/가공해도 무방

            // 진척도 계산 로직 (Task 완료 기반)
            int total = sourceVo.getTotalTasks();
            int completed = sourceVo.getCompletedTasks();

            // 0으로 나누는 오류 방지
            int progressRate = (total > 0) ? (int) Math.round(((double) completed / total) * 100) : 0;

            // 3. 계산된 값 설정 (ProjectSummaryVO에 setProgressRate, setStatus가 있어야 함)
            resultVo.setProgressRate(progressRate);
            resultVo.setStatus(progressRate == 100 ? "완료" : "진행 중");

            // 4. 협업자 이름 목록 조회 (추가 쿼리 호출 및 설정)
            // (ProjectSummaryVO에 setCoWorkerNames가 있어야 함)
            List<String> coWorkerNames = projectMapper.findCoWorkerNamesByProjectId(sourceVo.getProjectId());
            resultVo.setCoWorkerNames(coWorkerNames);

            return resultVo;

        }).collect(Collectors.toList());
    }

    // 2. 대시보드 요약 정보 조회
    public DashboardSummaryVO getDashboardSummary(Long userId) {
        // Mapper에서 바로 VO에 매핑되는 데이터를 반환
        return projectMapper.getDashboardSummaryByUserId(userId);
    }
}