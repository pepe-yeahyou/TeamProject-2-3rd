package com.example.myteam.command;
import lombok.Builder;
import lombok.Data; // @Data 사용
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class FileVO {
    private Long fileId;
    private String fileName;
    private String storagePath;
    private Long uploaderUserId;
    private LocalDateTime uploadedAt;
    private List<FileVO> attachedFiles;
}