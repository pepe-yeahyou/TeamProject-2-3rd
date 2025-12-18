package com.example.myteam.service;

import com.example.myteam.command.WriteVO;
import com.example.myteam.command.ProjectVO;
import com.example.myteam.command.UserVO;
import com.example.myteam.command.TaskCreateVO;
import com.example.myteam.entity.*;
import com.example.myteam.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class WriteServiceImpl implements WriteService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final MemberRepository memberRepository;
    private final TaskRepository taskRepository;

    @Autowired
    public WriteServiceImpl(ProjectRepository projectRepository,
                            UserRepository userRepository,
                            MemberRepository memberRepository,
                            TaskRepository taskRepository) {
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.memberRepository = memberRepository;
        this.taskRepository = taskRepository;
    }

    @Override
    @Transactional
    public Integer createProject(WriteVO writeVO, Integer currentUserId) {
        // 1. 현재 사용자 조회 (프로젝트 소유자)
        User owner = userRepository.findById(Long.valueOf(currentUserId))
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다. ID: " + currentUserId));

        // 2. Project 엔티티 생성
        Project project = new Project();
        project.setProjectTitle(writeVO.getProjectTitle());
        project.setDescription(writeVO.getDescription());
        project.setStartDate(writeVO.getStartDate());
        project.setEndDate(writeVO.getEndDate());
        project.setOwner(owner);
        project.setCreatedAt(LocalDateTime.now());
        project.setUpdatedAt(LocalDateTime.now());
        project.setStatus("진행중");

        // 3. 프로젝트 저장
        Project savedProject = projectRepository.save(project);
        Long projectId = savedProject.getProjectId();

        // 디버깅용: 생성된 프로젝트 ID 출력
        System.out.println("=== DEBUG: 새로 생성된 프로젝트 ID: " + projectId + " ===");

        // 4. 프로젝트 생성자를 멤버로 추가 (팀장)
        Member ownerMember = new Member();
        ownerMember.setProject(savedProject);
        ownerMember.setUser(owner);
        ownerMember.setIsLeader(true);
        ownerMember.setJoinedAt(LocalDateTime.now());

        // 디버깅용: 추가하려는 멤버 정보 출력
        System.out.println("=== DEBUG: 추가할 멤버 - 프로젝트ID: " + projectId +
                ", 사용자ID: " + owner.getUserId() + " ===");

        memberRepository.save(ownerMember);

        // 5. 초대된 사용자들 처리
        if (writeVO.getInvitedUserIds() != null && !writeVO.getInvitedUserIds().isEmpty()) {
            for (Integer invitedUserId : writeVO.getInvitedUserIds()) {
                User invitedUser = userRepository.findById(Long.valueOf(invitedUserId))
                        .orElseThrow(() -> new RuntimeException("초대할 사용자를 찾을 수 없습니다. ID: " + invitedUserId));

                // 중복 체크 추가
                boolean alreadyMember = memberRepository.existsByProjectProjectIdAndUserUserId(
                        projectId, invitedUser.getUserId());

                System.out.println("=== DEBUG: 중복 체크 - 프로젝트ID: " + projectId +
                        ", 사용자ID: " + invitedUser.getUserId() +
                        ", 이미멤버?: " + alreadyMember + " ===");

                if (!alreadyMember) {
                    Member member = new Member();
                    member.setProject(savedProject);
                    member.setUser(invitedUser);
                    member.setIsLeader(false);
                    member.setJoinedAt(LocalDateTime.now());
                    memberRepository.save(member);
                } else {
                    System.out.println("=== DEBUG: 이미 멤버이므로 건너뜀 ===");
                }
            }
        }

        if (writeVO.getInitialTasks() != null && !writeVO.getInitialTasks().isEmpty()) {
            for (TaskCreateVO taskVO : writeVO.getInitialTasks()) {
                Task task = new Task();
                task.setProject(savedProject);
                task.setTaskName(taskVO.getTaskName());
                task.setDescription(taskVO.getDescription());
                task.setStatus("대기중");
                task.setIsCompleted(false);
                task.setCreatedAt(LocalDateTime.now());
                task.setUpdatedAt(LocalDateTime.now());

                if (taskVO.getAssignedUserId() != null) {
                    User assignedUser = userRepository.findById(Long.valueOf(taskVO.getAssignedUserId()))
                            .orElse(null);
                    task.setAssignedUser(assignedUser);
                } else {
                    // assignedUserId가 null이면 팀장에게 배정
                    task.setAssignedUser(owner);  // owner는 팀장
                }

                taskRepository.save(task);
            }
        }


        // 7. 생성된 프로젝트 ID 반환
        return projectId.intValue();
    }

    @Override
    public List<UserVO> searchUsers(String query) {  // limit 파라미터 제거
        // Pageable 제거
        List<User> users = userRepository.findByDisplayNameContainingOrUsernameContaining(
                query, query);

        // User 엔티티를 UserVO로 변환
        return users.stream().map(user -> {
            UserVO userVO = new UserVO();
            userVO.setUserId(user.getUserId().intValue());
            userVO.setUsername(user.getUsername());
            userVO.setDisplayName(user.getDisplayName());
            userVO.setCreatedAt(user.getCreatedAt());
            userVO.setUpdatedAt(user.getUpdatedAt());
            return userVO;
        }).collect(Collectors.toList());
    }

    @Override
    public ProjectVO getProjectById(Integer projectId) {
        Optional<Project> projectOpt = projectRepository.findById(Long.valueOf(projectId));

        if (projectOpt.isEmpty()) {
            return null;
        }

        Project project = projectOpt.get();

        // Project 엔티티를 ProjectVO로 변환
        ProjectVO projectVO = new ProjectVO();
        projectVO.setProjectID(project.getProjectId().intValue());
        projectVO.setOwnerID(project.getOwner().getUserId().intValue());
        projectVO.setProjectTitle(project.getProjectTitle());
        projectVO.setDescription(project.getDescription());
        projectVO.setStartDate(project.getStartDate());
        projectVO.setEndDate(project.getEndDate());
        projectVO.setCreateAt(project.getCreatedAt());
        projectVO.setUpdateAt(project.getUpdatedAt());

        return projectVO;
    }
}