package com.example.myteam.service;

import com.example.myteam.repository.DetailRepository;
import com.example.myteam.repository.TaskRepository;
import com.example.myteam.repository.FileRepository;
import com.example.myteam.command.DetailVO;
import com.example.myteam.command.MemberVO;
import com.example.myteam.command.TaskVO;
import com.example.myteam.command.UpdateVO;
import com.example.myteam.command.FileVO;
import com.example.myteam.entity.Project;
import com.example.myteam.entity.Task;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


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


    @Override
    @Transactional(readOnly = true)
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
        boolean isProjectCompleted = isProjectCompleted(project.getStatus());

        List<TaskVO> workList = project.getTasks().stream()
                .map(task -> TaskVO.builder()
                        .taskId(task.getTaskId())
                        .taskName(task.getTaskName())
                        .status(task.getStatus())
                        .isCompleted(task.getIsCompleted())

                        .assignedUserName(task.getAssignedUser().getDisplayName())
                        .build())
                .collect(Collectors.toList());

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


        return DetailVO.builder()
                .projectId(project.getProjectId())
                .title(project.getProjectTitle())
                .description(project.getDescription())
                .status(project.getStatus())
                .progressPercentage(progress)
                .isChatActive(!isProjectCompleted)

                .ownerId(ownerId)

                .managerName(managerName)
                .coWorkers(coWorkers)
                .workList(workList)
                .attachedFiles(attachedFiles)
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

        Optional<Task> optionalTask = taskRepository.findById(taskId);

        if (!optionalTask.isPresent()) {
            throw new RuntimeException("Task ID " + taskId + " not found.");
        }
        Task task = optionalTask.get();

        Project project = task.getProject();

        Long assigneeId = task.getAssignedUser().getUserId();


        List<Long> collaboratorIds = project.getMembers().stream()
                .map(member -> member.getUser().getUserId())
                .collect(Collectors.toList());


        if (!assigneeId.equals(currentUserId) // 담당자가 아닌 경우
                && !collaboratorIds.contains(currentUserId)) { // 협업자 목록에도 없는 경우


            throw new SecurityException("Task 상태 변경 권한이 없습니다. (담당자 또는 프로젝트 협업자만 가능)");
        }

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