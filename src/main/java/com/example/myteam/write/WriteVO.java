package com.example.myteam.write;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WriteVO {
    private String title;          // 모바일 앱 개발
    private String description;    // 프로젝트 내용
    private List<String> taskNames; // 해야할 것 (리스트)
    private List<Long> memberIds;  // 협업자 배정 (ID 리스트)
}