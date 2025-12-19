package com.example.myteam.service;

import com.example.myteam.command.*;
import com.example.myteam.repository.DetailRepository;
import com.example.myteam.repository.TaskRepository;
import com.example.myteam.repository.FileRepository;
import com.example.myteam.entity.Project;
import com.example.myteam.entity.Task;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class DetailServiceImpl implements DetailService {

    private final DetailRepository detailRepository;
    private final TaskRepository taskRepository;
    private final FileRepository fileRepository;

    @Autowired
    public DetailServiceImpl(DetailRepository detailRepository,
                             TaskRepository taskRepository,
                             FileRepository fileRepository) { // 💡 2. 생성자 주입
        this.detailRepository = detailRepository;
        this.taskRepository = taskRepository;
        this.fileRepository = fileRepository;
    }


    public DetailVO getProjectDetail(Long projectId) {
        Optional<Project> optionalProject = detailRepository.findByProjectId(projectId);

        if (!optionalProject.isPresent()) {
            throw new RuntimeException("Project not found.");
        }

        Project project = optionalProject.get();

        Long ownerId = project.getOwner().getUserId();
        String managerName = project.getOwner().getDisplayName();

        List<MemberVO> coWorkers = project.getMembers().stream()
                .map(member -> MemberVO.builder()
                        .userId(member.getUser().getUserId())
                        .displayName(member.getUser().getDisplayName())
                        .isLeader(false)
                        .joinedAt(member.getJoinedAt())
                        .build())
                .collect(Collectors.toList());

        int progress = calculateProgress(projectId);

        // 💡 [추가/수정] 기간 만료 및 상태 로직
        LocalDate today = LocalDate.now();
        String currentStatus = project.getStatus();

        // 만약 완료가 아니고, 종료일이 오늘보다 이전이면 "기간만료"로 판단
        if (!"완료".equalsIgnoreCase(currentStatus) && project.getEndDate() != null && project.getEndDate().isBefore(today)) {
            currentStatus = "기간만료";
        }

        boolean isChatEnabled = "진행중".equalsIgnoreCase(currentStatus);

        List<TaskVO> workList = project.getTasks().stream()
                .map(task -> TaskVO.builder()
                        .taskId(task.getTaskId())
                        .taskName(task.getTaskName())
                        .status(task.getStatus())
                        .isCompleted(task.getIsCompleted())
                        .assignedUserName(task.getAssignedUser().getDisplayName())
                        .build())
                .collect(Collectors.toList());

        /* 파일추가 기능 삭제
        List<FileVO> attachedFiles = fileRepository.findByProject_ProjectId(projectId).stream()
                .map(fileEntity -> FileVO.builder()
                        .fileId(fileEntity.getFileId())
                        .fileName(fileEntity.getFileName())
                        .storagePath(fileEntity.getStoragePath())
                        // FileEntity의 uploader 필드가 User 엔티티라고 가정
                        .uploaderUserId(fileEntity.getUploader().getUserId())
                        .uploadedAt(fileEntity.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

         */


        return DetailVO.builder()
                .projectId(project.getProjectId())
                .title(project.getProjectTitle())
                .description(project.getDescription())
                .status(currentStatus) // 💡 계산된 상태값 주입
                .progressPercentage(progress)
                .isChatActive(isChatEnabled) // 💡 진행중일때만 활성화
                .ownerId(ownerId)
                .managerName(managerName)
                .coWorkers(coWorkers)
                .workList(workList)
                //.attachedFiles(attachedFiles)
                .startDate(project.getStartDate()) // 💡 [추가]
                .endDate(project.getEndDate())     // 💡 [추가]
                .build();
    }

    // 프로젝트 완료 여부 확인 (예시)
    private boolean isProjectCompleted(String status) {
        return "완료".equalsIgnoreCase(status);
    }

    private int calculateProgress(Long projectId) {
        return 0;
    }

    /*@Override
    @Transactional
    public void updateProject(Long projectId, UpdateVO request, Long currentUserId) {
        Optional<Project> optionalProject = detailRepository.findByProjectId(projectId);

        if (!optionalProject.isPresent()) {
            throw new RuntimeException("Project not found.");
        }
        Project project = optionalProject.get();

        // 2. 프로젝트 수정/삭제는 프로젝트 작성자만 진행한다 (권한 체크)
        if (!project.getOwner().getUserId().equals(currentUserId)) {
            throw new SecurityException("수정 권한이 없습니다. (작성자만 수정 가능)");
        }

        project.setProjectTitle(request.getTitle());
        project.setDescription(request.getDescription());
    }*/
    @Override
    @Transactional
    public void updateProject(Long projectId, UpdateVO request, Long currentUserId) {
        // 1. 프로젝트 조회
        Optional<Project> optionalProject = detailRepository.findByProjectId(projectId);

        if (!optionalProject.isPresent()) {
            throw new RuntimeException("Project not found.");
        }
        Project project = optionalProject.get();

        // 2. 프로젝트 작성자 권한 체크 (작성자 ID와 현재 로그인한 ID 비교)
        if (project.getOwner().getUserId() != currentUserId) {
            throw new SecurityException("수정 권한이 없습니다. (작성자만 수정 가능)");
        }

        // 3. UserVO에서 프로젝트 정보를 꺼내어 업데이트
        // 만약 request.getProjectTitle()이 null이면 기존 제목을 유지하거나 "제목 없음"으로 처리
        String newTitle = (request.getProjectTitle() != null) ? request.getProjectTitle() : project.getProjectTitle();
        String newDescription = (request.getDescription() != null) ? request.getDescription() : project.getDescription();

        project.setProjectTitle(newTitle);
        project.setDescription(newDescription);

        // 필요 시 날짜 등 추가 필드 업데이트
        // project.setStartDate(request.getStartDate());
        // project.setEndDate(request.getEndDate());

        // @Transactional이 걸려있으므로 별도의 save 호출 없이 변경 감지(Dirty Checking)로 반영됩니다.
    }

    @Override
    @Transactional
    public void deleteProject(Long projectId, Long currentUserId) {
        Optional<Project> optionalProject = detailRepository.findByProjectId(projectId);

        if (!optionalProject.isPresent()) {
            throw new RuntimeException("Project not found.");
        }
        Project project = optionalProject.get();

        if (!project.getOwner().getUserId().equals(currentUserId)) {
            throw new SecurityException("삭제 권한이 없습니다. (작성자만 삭제 가능)");
        }

        detailRepository.deleteById(projectId);
    }

    @Override
    @Transactional
    public void updateTaskStatus(Long taskId, boolean isCompleted, Long currentUserId) {
        // 로그 찍어서 확인해라 (콘솔에 찍힌 ID가 3, 5, 7 중에 있는지 확인용)
        System.out.println("로그인한 유저 ID: " + currentUserId);

        Optional<Task> optionalTask = taskRepository.findById(taskId);
        if (!optionalTask.isPresent()) {
            throw new RuntimeException("Task ID " + taskId + " not found.");
        }
        Task task = optionalTask.get();
        Project project = task.getProject();

        // 1. 담당자 확인 (null 체크 필수)
        Long assigneeId = (task.getAssignedUser() != null) ? task.getAssignedUser().getUserId() : null;

        // 2. 협업자 리스트 추출
        List<Long> collaboratorIds = project.getMembers().stream()
                .map(member -> member.getUser().getUserId())
                .collect(Collectors.toList());

        System.out.println("이 프로젝트의 권한 유저들: " + collaboratorIds);

        // 3. 권한 체크 (담당자이거나 협업자 리스트에 포함되어야 함)
        // .equals()를 써서 객체 비교를 확실히 해라
        boolean isAssignee = assigneeId != null && assigneeId.equals(currentUserId);
        boolean isCollaborator = collaboratorIds.contains(currentUserId);

        if (!isAssignee && !isCollaborator) {
            throw new SecurityException("Task 상태 변경 권한이 없습니다. 현재 접속 ID: " + currentUserId);
        }

        // 4. 상태 업데이트
        String newStatus = isCompleted ? "COMPLETED" : "IN_PROGRESS";
        task.setIsCompleted(isCompleted);
        task.setStatus(newStatus);

        taskRepository.save(task);
    }
    @Override
    @Transactional(readOnly = true)
    public Optional<FileVO> getFileInfoById(Long fileId) {
        return fileRepository.findByFileId(fileId)
                .map(fileEntity -> FileVO.builder()
                        .fileId(fileEntity.getFileId())
                        .fileName(fileEntity.getFileName())
                        .storagePath(fileEntity.getStoragePath())
                        .uploaderUserId(fileEntity.getUploader().getUserId())
                        .uploadedAt(fileEntity.getCreatedAt())
                        .build());
    }
}