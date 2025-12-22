package com.example.myteam.service;

import com.example.myteam.command.*;
import com.example.myteam.repository.DetailRepository;
import com.example.myteam.repository.TaskRepository;
import com.example.myteam.repository.FileRepository;
import com.example.myteam.repository.UserRepository; // 유저 조회를 위해 추가
import com.example.myteam.entity.Project;
import com.example.myteam.entity.Task;
import com.example.myteam.entity.Member;
import com.example.myteam.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class DetailServiceImpl implements DetailService {

    private final DetailRepository detailRepository;
    private final TaskRepository taskRepository;
    private final FileRepository fileRepository;
    private final UserRepository userRepository; // 💡 에러 해결을 위해 필드 유지

    @Autowired
    public DetailServiceImpl(DetailRepository detailRepository,
                             TaskRepository taskRepository,
                             FileRepository fileRepository,
                             UserRepository userRepository) { // 💡 생성자 주입 유지
        this.detailRepository = detailRepository;
        this.taskRepository = taskRepository;
        this.fileRepository = fileRepository;
        this.userRepository = userRepository;
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
                        .userId(member.getUser().getUserId().intValue())
                        .displayName(member.getUser().getDisplayName())
                        .isLeader(member.getIsLeader() != null ? member.getIsLeader() : false)
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
                        .taskId(task.getTaskId().intValue())
                        .userId(task.getAssignedUser().getUserId().intValue()) // 💡 TaskVO 참조
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

    @Override
    @Transactional
    public void updateProject(Long projectId, UpdateVO request, Long currentUserId) {
        // 1. 프로젝트 조회 및 권한 체크
        Project project = detailRepository.findByProjectId(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found."));

        if (!project.getOwner().getUserId().equals(currentUserId)) {
            throw new SecurityException("수정 권한이 없습니다.");
        }

        // 2. 기본 정보 업데이트
        if (request.getProjectTitle() != null) project.setProjectTitle(request.getProjectTitle());
        if (request.getDescription() != null) project.setDescription(request.getDescription());
        if (request.getStartDate() != null) project.setStartDate(request.getStartDate());
        if (request.getEndDate() != null) project.setEndDate(request.getEndDate());
        project.setUpdatedAt(LocalDateTime.now());

        // 3. 협업자(Member) 수정 로직 (교집합 유지 방식 - Duplicate Entry 해결)
        if (request.getMemberList() != null) {
            // A. 요청으로 들어온 유저 ID 리스트 (중복 제거)
            List<Long> incomingUserIds = request.getMemberList().stream()
                    .map(m -> (long) m.getUserId())
                    .distinct()
                    .collect(Collectors.toList());

            // B. 삭제할 멤버 처리: 기존 멤버 중 요청 리스트에 없는 사람만 제거
            project.getMembers().removeIf(existingMember ->
                    !incomingUserIds.contains(existingMember.getUser().getUserId())
            );

            // C. 추가할 멤버 처리: 요청 리스트 중 현재 프로젝트 멤버에 없는 사람만 추가
            List<Long> currentMemberUserIds = project.getMembers().stream()
                    .map(m -> m.getUser().getUserId())
                    .collect(Collectors.toList());

            for (Long userId : incomingUserIds) {
                if (!currentMemberUserIds.contains(userId)) {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new RuntimeException("User not found: " + userId));

                    Member newMember = new Member();
                    newMember.setProject(project);
                    newMember.setUser(user);
                    newMember.setIsLeader(false);
                    newMember.setJoinedAt(LocalDateTime.now());
                    project.getMembers().add(newMember);
                }
            }
        }

        // 4. 할 일(Task) 수정 로직 (최종 해결판)
        // 4. 할 일(Task) 수정 로직 (이게 진짜 최종입니다)
        if (request.getTaskList() != null) {

            // 1) Repository를 통해 DB에서 직접 물리 삭제 (로그에 찍힌 그 쿼리!)
            taskRepository.deleteByProjectIdDirectly(projectId);

            // ❌ project.getTasks().clear();  <-- 이 줄을 반드시 지우세요! (에러 원인)

            // 2) 새로 들어온 할 일들만 생성해서 채우기
            for (UpdateVO.TaskUpdateDTO tDto : request.getTaskList()) {
                if (tDto.getTaskName() == null || tDto.getTaskName().trim().isEmpty()) continue;

                Long assignedId = (tDto.getUserId() == null || tDto.getUserId() <= 0)
                        ? project.getOwner().getUserId()
                        : tDto.getUserId();

                User assignedUser = userRepository.findById(assignedId)
                        .orElseThrow(() -> new RuntimeException("User not found: " + assignedId));

                Task newTask = new Task();
                newTask.setTaskName(tDto.getTaskName());
                newTask.setProject(project);
                newTask.setAssignedUser(assignedUser);
                newTask.setStatus("IN_PROGRESS");
                newTask.setIsCompleted(false);
                newTask.setCreatedAt(LocalDateTime.now());

                // 💡 리스트에 바로 담지 말고, 저장(Save)이 필요할 수 있으니 안전하게 처리
                taskRepository.save(newTask);
            }
        }
    }

    @Override
    @Transactional
    public void deleteProject(Long projectId, Long currentUserId) {
        // 1. 기존 메서드 사용 (detailRepository 내 findByProjectId 유지)
        Project project = detailRepository.findByProjectId(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found."));

        // 2. 권한 검사 (타입 불일치 방지를 위해 longValue() 또는 equals 사용)
        // project.getOwner().getUserId()와 currentUserId가 둘 다 Long 객체라면 equals가 정확함
        if (!project.getOwner().getUserId().equals(currentUserId)) {
            throw new SecurityException("삭제 권한이 없습니다. (작성자만 삭제 가능)");
        }

        // 3. 삭제 처리 (있는 메서드 deleteById 사용)
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
        task.setUpdatedAt(LocalDateTime.now());

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