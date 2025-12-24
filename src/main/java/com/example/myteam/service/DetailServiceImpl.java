package com.example.myteam.service;

import com.example.myteam.command.*;
import com.example.myteam.repository.*;
import com.example.myteam.entity.Project;
import com.example.myteam.entity.Task;
import com.example.myteam.entity.Member;
import com.example.myteam.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class DetailServiceImpl implements DetailService {

    private final DetailRepository detailRepository;
    private final TaskRepository taskRepository;
    private final FileRepository fileRepository;
    private final UserRepository userRepository;
    private final MemberRepository memberRepository;

    @Autowired
    public DetailServiceImpl(DetailRepository detailRepository,
                             TaskRepository taskRepository,
                             FileRepository fileRepository,
                             UserRepository userRepository,
                             MemberRepository memberRepository) {
        this.detailRepository = detailRepository;
        this.taskRepository = taskRepository;
        this.fileRepository = fileRepository;
        this.userRepository = userRepository;
        this.memberRepository = memberRepository;
    }

    @Override
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

        LocalDate today = LocalDate.now();
        String currentStatus = project.getStatus();

        if (!"완료".equalsIgnoreCase(currentStatus) && project.getEndDate() != null && project.getEndDate().isBefore(today)) {
            currentStatus = "기간만료";
        }

        boolean isChatEnabled = "진행중".equalsIgnoreCase(currentStatus);

        List<TaskVO> workList = project.getTasks().stream()
                .map(task -> TaskVO.builder()
                        .taskId(task.getTaskId().intValue())
                        .userId(task.getAssignedUser().getUserId().intValue())
                        .taskName(task.getTaskName())
                        .status(task.getStatus())
                        .isCompleted(task.getIsCompleted())
                        .assignedUserName(task.getAssignedUser().getDisplayName())
                        .build())
                .collect(Collectors.toList());

        return DetailVO.builder()
                .projectId(project.getProjectId())
                .title(project.getProjectTitle())
                .description(project.getDescription())
                .status(currentStatus)
                .progressPercentage(progress)
                .isChatActive(isChatEnabled)
                .ownerId(ownerId)
                .managerName(managerName)
                .coWorkers(coWorkers)
                .workList(workList)
                .startDate(project.getStartDate())
                .endDate(project.getEndDate())
                .build();
    }

    private boolean isProjectCompleted(String status) {
        return "완료".equalsIgnoreCase(status);
    }

    private int calculateProgress(Long projectId) {
        return 0;
    }

    @Override
    @Transactional
    public void updateProject(Long projectId, UpdateVO request, Long currentUserId) {
        Project project = detailRepository.findByProjectId(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found."));

        if (!project.getOwner().getUserId().equals(currentUserId)) {
            throw new SecurityException("수정 권한이 없습니다.");
        }

        if (request.getProjectTitle() != null) project.setProjectTitle(request.getProjectTitle());
        if (request.getDescription() != null) project.setDescription(request.getDescription());
        if (request.getStartDate() != null) project.setStartDate(request.getStartDate());
        if (request.getEndDate() != null) project.setEndDate(request.getEndDate());
        project.setUpdatedAt(LocalDateTime.now());

        // 3. 협업자(Member) 수정
        if (request.getMemberList() != null) {
            memberRepository.deleteByProjectIdDirectly(projectId);
            project.getMembers().clear();

            for (UpdateVO.MemberUpdateDTO mDto : request.getMemberList()) {
                Long userId = (long) mDto.getUserId();
                if (userId.equals(project.getOwner().getUserId())) continue;

                User user = userRepository.findById(userId)
                        .orElseThrow(() -> new RuntimeException("User not found: " + userId));

                Member newMember = new Member();
                newMember.setProject(project);
                newMember.setUser(user);
                newMember.setIsLeader(false);
                newMember.setJoinedAt(LocalDateTime.now());

                memberRepository.save(newMember);
                project.getMembers().add(newMember);
            }
        }

        // 4. 할 일(Task) 수정 (생략 없이 모든 로직 채움)
        if (request.getTaskList() != null) {
            taskRepository.deleteByProjectIdDirectly(projectId);
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

                taskRepository.save(newTask);
            }
        }

        detailRepository.saveAndFlush(project);
    }

    @Override
    @Transactional
    public void deleteProject(Long projectId, Long currentUserId) {
        Project project = detailRepository.findByProjectId(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found."));

        if (!project.getOwner().getUserId().equals(currentUserId)) {
            throw new SecurityException("삭제 권한이 없습니다. (작성자만 삭제 가능)");
        }

        detailRepository.deleteById(projectId);
    }

    @Override
    @Transactional
    public void updateTaskStatus(Long taskId, boolean isCompleted, Long currentUserId) {
        System.out.println("로그인한 유저 ID: " + currentUserId);

        Optional<Task> optionalTask = taskRepository.findById(taskId);
        if (!optionalTask.isPresent()) {
            throw new RuntimeException("Task ID " + taskId + " not found.");
        }
        Task task = optionalTask.get();
        Project project = task.getProject();

        Long assigneeId = (task.getAssignedUser() != null) ? task.getAssignedUser().getUserId() : null;

        List<Long> collaboratorIds = project.getMembers().stream()
                .map(member -> member.getUser().getUserId())
                .collect(Collectors.toList());

        System.out.println("이 프로젝트의 권한 유저들: " + collaboratorIds);

        boolean isAssignee = assigneeId != null && assigneeId.equals(currentUserId);
        boolean isCollaborator = collaboratorIds.contains(currentUserId);

        if (!isAssignee && !isCollaborator) {
            throw new SecurityException("Task 상태 변경 권한이 없습니다. 현재 접속 ID: " + currentUserId);
        }

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