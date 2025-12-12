package com.example.myteam.project;

import org.apache.ibatis.annotations.Mapper;
import java.util.List;

@Mapper
public class ProjectMapper {
    List<ProjectSummaryVO> findProjectsAndTaskCountsByUserId(@Param("userId") Long userId);
    DashboardSummaryVO getDashboardSummaryByUserId(@Param("userId") Long userId);
    List<String> findCoWorkerNamesByProjectId(@Param("projectId") Long projectId);
}
