package com.example.myteam.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "FILE")
public class FileEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "FILE_ID")
    private Long fileId;

    // PROJECT_ID
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PROJECT_ID", nullable = false)
    private Project project;

    // UPLOADER_USER_ID
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "USER_ID", nullable = false)
    private User uploader;

    @Column(name = "FILE_NAME", length = 255)
    private String fileName;

    @Column(name = "STORAGE_PATH", length = 255)
    private String storagePath;

    @Column(name = "CREATED_AT")
    private LocalDateTime createdAt;
}