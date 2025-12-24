package com.example.myteam.write;

import com.example.myteam.command.*;
import com.example.myteam.entity.*;
import com.example.myteam.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
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
    public int createProject(ProjectVO projectVO, int currentUserId) {
        // 1. 소유자 조회
        User owner = userRepository.findById((long) currentUserId)
                .orElseThrow(() -> new RuntimeException("User not found: " + currentUserId));

        // 2. Project 엔티티 생성 (Setter 방식)
        Project project = new Project();
        project.setProjectTitle(projectVO.getProjectTitle());
        project.setDescription(projectVO.getDescription());
        project.setStartDate(projectVO.getStartDate());
        project.setEndDate(projectVO.getEndDate());
        project.setOwner(owner);
        project.setCreatedAt(LocalDateTime.now());
        project.setUpdatedAt(LocalDateTime.now());
        project.setStatus("진행중");

        Project savedProject = projectRepository.save(project);
        long projectId = savedProject.getProjectId();

        // 3. 소유자를 리더로 등록
        Member ownerMember = new Member();
        ownerMember.setProject(savedProject);
        ownerMember.setUser(owner);
        ownerMember.setIsLeader(true);
        ownerMember.setJoinedAt(LocalDateTime.now());
        memberRepository.save(ownerMember);

        // 4. 협업자 리스트 등록 (mVo.getUserId() 사용)
        if (projectVO.getMemberList() != null) {
            for (MemberVO mVo : projectVO.getMemberList()) {
                userRepository.findById((long) mVo.getUserId()).ifPresent(invitedUser -> {
                    if (invitedUser.getUserId() != owner.getUserId()) {
                        Member member = new Member();
                        member.setProject(savedProject);
                        member.setUser(invitedUser);
                        member.setIsLeader(false);
                        member.setJoinedAt(LocalDateTime.now());
                        memberRepository.save(member);
                    }
                });
            }
        }

        // 5. 할 일 리스트 등록 (tVo.getUserId() 사용)
        if (projectVO.getTaskList() != null) {
            for (TaskVO tVo : projectVO.getTaskList()) {
                Task task = new Task();
                task.setProject(savedProject);
                task.setTaskName(tVo.getTaskName());
                task.setStatus("대기중");
                task.setIsCompleted(false);
                task.setCreatedAt(LocalDateTime.now());

                // 담당자 ID가 있으면 해당 유저로, 없으면 소유자로 배정
                User assignedUser = (tVo.getUserId() > 0) ?
                        userRepository.findById((long) tVo.getUserId()).orElse(owner) : owner;
                task.setAssignedUser(assignedUser);

                taskRepository.save(task);
            }
        }

        return (int) projectId;
    }

    @Override
    public List<UserVO> searchUsers(String query) {
        return userRepository.findByDisplayNameContainingOrUsernameContaining(query, query)
                .stream().map(user -> {
                    UserVO vo = new UserVO();
                    vo.setUserId(user.getUserId().intValue());
                    vo.setDisplayName(user.getDisplayName());
                    vo.setUsername(user.getUsername());
                    return vo;
                }).collect(Collectors.toList());
    }

    @Override
    public ProjectVO getProjectById(int projectId) {
        Project project = projectRepository.findById((long) projectId).orElse(null);
        if (project == null) return null;

        ProjectVO vo = new ProjectVO();
        vo.setProjectID(project.getProjectId().intValue());
        vo.setProjectTitle(project.getProjectTitle());
        vo.setDescription(project.getDescription());
        vo.setStartDate(project.getStartDate());
        vo.setEndDate(project.getEndDate());
        vo.setOwnerID(project.getOwner().getUserId().intValue());
        return vo;
    }

    @Override
    public List<UserVO> getAllUsers() {
        return userRepository.findAllByOrderByDisplayNameAsc()
                .stream().map(user -> {
                    UserVO vo = new UserVO();
                    vo.setUserId(user.getUserId().intValue());
                    vo.setDisplayName(user.getDisplayName());
                    return vo;
                }).collect(Collectors.toList());
    }
}