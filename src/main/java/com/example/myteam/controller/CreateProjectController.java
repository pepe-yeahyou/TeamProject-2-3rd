package com.example.myteam.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@Controller
public class CreateProjectController {

    // 프로젝트 생성 페이지 보여주기
    @GetMapping("/create-project")
    public String createProjectPage() {
        return "create-project";  // create-project.html 반환
    }

    // 프로젝트 상세 페이지
    @GetMapping("/projects/{id}")
    public String projectDetailPage(@PathVariable Long id, Model model) {
        model.addAttribute("projectId", id);
        return "project-detail";
    }
}