package com.example.myteam.write;

import com.example.myteam.command.ProjectVO;
import com.example.myteam.command.UserVO;
import java.util.List;

public interface WriteService {
    int createProject(ProjectVO projectVO, int currentUserId);
    List<UserVO> searchUsers(String query);
    ProjectVO getProjectById(int projectId);
    List<UserVO> getAllUsers();
}