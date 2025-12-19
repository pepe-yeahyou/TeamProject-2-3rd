package com.example.myteam.project;

import com.example.myteam.command.DashboardSummaryVO;
import com.example.myteam.command.ProjectSummaryVO; // VO 경로 확인
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param; // Param import 누락

import java.util.List;

@Mapper
public interface ProjectMapper {
    List<ProjectSummaryVO> findProjectsAndTaskCountsByUserId(@Param("userId") Long userId);
    DashboardSummaryVO getDashboardSummaryByUserId(@Param("userId") Long userId);
    List<String> findCoWorkerNamesByProjectId(@Param("projectId") Long projectId);
}