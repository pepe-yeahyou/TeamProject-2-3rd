// src/component/Detail.js (전체 코드)

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Chat from './Chat';
import { useParams, useNavigate } from 'react-router-dom';
import '../css/Detail.css';

// 백엔드 API 기본 경로
const API_BASE_URL = 'http://localhost:8484/detail';

// ---------------------- 유틸리티 함수 ----------------------

// 진척도 계산 유틸리티 함수
const calculateProgress = (workList) => {
    const totalTasks = workList.length;
    const completedTasks = workList.filter(task => task.status === 'COMPLETED').length;
    
    return totalTasks === 0
        ? 0
        : Math.round((completedTasks / totalTasks) * 100);
};


// ---------------------- Detail 컴포넌트 본체 ----------------------

function Detail() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    
    const currentUser = {
        userId: 1, // 테스트 사용자 ID 설정 (예: 1)
        userName: "테스트유저",
        isLoggedIn: true,
    };
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    
    // 💡 [안전 장치 포함] project가 null이 아닐 때만 데이터 접근
    const coWorkers = project?.coWorkers || [];
    const isProjectManager = project && project.ownerId === currentUser.userId;
    const isCoWorker = coWorkers.some(worker => worker.userId === currentUser.userId);
    
    // 권한 변수
    const hasTaskPermission = isProjectManager || isCoWorker;
    const hasEditPermission = isProjectManager;
    
    

    // 1. 프로젝트 상세 정보 가져오기 (GET)
    const fetchProjectDetail = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/${projectId}`);
            
            let loadedProjectData = response.data;
            setError(null);

            // ==========================================================
            // 💡 [테스트용: 더미 파일 목록 주입 로직]
            // 백엔드에서 파일 데이터가 없을 경우에만 프론트엔드에서 강제로 생성
            if (!loadedProjectData.attachedFiles || loadedProjectData.attachedFiles.length === 0) {
                 loadedProjectData = {
                     ...loadedProjectData,
                     // 파일 다운로드 링크 테스트를 위해 fileId를 임시로 부여
                     attachedFiles: [
                         { fileId: 9991, fileName: `기획서_v1_${projectId}.pdf` },
                         { fileId: 9992, fileName: `디자인_시안.zip` },
                         { fileId: 9993, fileName: `업로드된_파일이_많다는_가정.docx` }
                     ]
                 };
            }
            // ==========================================================

            setProject(loadedProjectData); // 수정된 데이터를 상태에 저장
        } catch (err) {
            setError('프로젝트 정보를 불러오는 데 실패했습니다.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchProjectDetail();
    }, [fetchProjectDetail]);
    
    // ---------------------- 수정/삭제 핸들러 (추가 및 복구) ----------------------

    /**
     * 프로젝트 메타데이터 수정 처리 (진척도 업데이트 시 내부적으로 사용)
     */
    const handleProgressUpdate = async (newProgress) => {
        if (!isProjectManager) return; 

        try {
            // API: POST /detail/{projectId} (Body에 수정 데이터 포함)
            await axios.post(`${API_BASE_URL}/${projectId}`, { ...project, progress: newProgress }); 
        } catch (err) {
            console.error('진척도 업데이트 실패:', err);
        }
    };


    /**
     * 💡 프로젝트 수정 버튼 핸들러 (Write 페이지로 이동)
     */
    const handleEditClick = () => {
        if (!project || !hasEditPermission) return alert('프로젝트 수정 권한이 없거나 데이터 로딩 중입니다.');
        
        navigate('/write', { 
            state: { 
                projectData: project,
                isEditMode: true // 수정 모드임을 알려주는 플래그
            } 
        });
    };

    /**
     * 💡 프로젝트 삭제 처리 (POST /detail/{projectId}?operation=DELETE)
     */
    const handleDelete = async () => {
        if (!hasEditPermission) return alert('프로젝트 삭제 권한이 없습니다.');
        if (!window.confirm('프로젝트를 삭제하시겠습니까?')) return;
        try {
            await axios.post(`${API_BASE_URL}/${projectId}?operation=DELETE`); 
            
            alert('프로젝트가 성공적으로 삭제되었습니다.');
            navigate('/'); 
        } catch (err) {
            alert('프로젝트 삭제에 실패했습니다. 권한을 확인하세요.');
            console.error(err);
        }
    };

    
    /**
     * 작업 목록 상태 변경 및 UI 동기화
     */
    const handleTaskStatusToggle = async (taskId, currentStatus) => {
        if (!hasTaskPermission) return alert('작업 상태 변경 권한이 없습니다.');
        
        const isCompleted = currentStatus !== 'COMPLETED'; 
        const confirmMessage = isCompleted ? '완료' : '진행중';
        
        if (!window.confirm(`작업 상태를 [${confirmMessage}]으로 변경하시겠습니까?`)) return;

        try {
            // 1) 작업 상태 변경 API 호출 (백엔드 데이터 변경)
            await axios.post(
                `${API_BASE_URL}/${projectId}/task/${taskId}?isCompleted=${isCompleted}`
            );
            
            // 2) 변경된 작업 목록을 기준으로 새로운 상태 객체 생성 및 진척도 계산
            const newWorkList = (project.workList || []).map(task => 
                task.taskId === taskId 
                    ? { ...task, status: isCompleted ? 'COMPLETED' : 'IN_PROGRESS' } 
                    : task
            );
            const newProgress = calculateProgress(newWorkList);
            
            // 3) 계산된 진척도를 프로젝트 메타데이터에 반영 (관리자만 가능)
            if (isProjectManager) {
                 await handleProgressUpdate(newProgress); // 비동기 API 호출만 수행
            }
            
            // 4) setProject()를 사용하여 상태 즉시 업데이트
            setProject(prevProject => ({ 
                ...prevProject, 
                workList: newWorkList,
                progress: newProgress 
            }));
            
        } catch (err) {
            alert('작업 상태 변경에 실패했습니다. 권한을 확인하세요.');
            console.error(err);
        }
    };

    useEffect(() => {
        if (project) {
            console.log('--- 최종 프로젝트 권한 데이터 ---');
            console.log(`프론트엔드 currentUser.userId: ${currentUser.userId}`);
            console.log(`백엔드 데이터 project.ownerId: ${project.ownerId}`);
            console.log(`최종 권한 isProjectManager: ${project.ownerId === currentUser.userId}`);
            console.log(`버튼 표시 여부 hasEditPermission: ${hasEditPermission}`);
            // 💡 파일 목록이 콘솔에 출력되어야 합니다.
            console.log(`첨부 파일 목록: `, project.attachedFiles);
            console.log('------------------------------');
        }
    }, [project, currentUser.userId, hasEditPermission]);
    

    // ---------------------- 렌더링 시작 ----------------------

    if (loading) return <div>로딩 중...</div>;
    if (error) return <div>오류: {error}</div>;
    if (!project) return <div>프로젝트를 찾을 수 없습니다.</div>; 


    const calculatedProgress = calculateProgress(project.workList || []); 
    const projectStatus = calculatedProgress === 100 ? '완료' : '진행중';

    return (
        <div className="detail-page"> 
            
            {/* 좌측 메인 컨텐츠 (제목, 설명, 진척도, 작업 목록) */}
            <div className="main-content">
                
                {/* 1. 제목 및 상태 / 수정 버튼 */}
                <div className="detail-card title-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        
                        <h2>
                            {project.title} 
                            <span className={`status-${projectStatus}`}>{projectStatus}</span>
                        </h2>
                        
                        {/* 💡 2. 수정/삭제 버튼 (관리자에게만 표시) */}
                        {hasEditPermission && (
                            <div className="action-buttons">
                                <button onClick={handleEditClick} title="수정"><span style={{ fontSize: '1.2em' }}>✏️</span></button>
                                <button onClick={handleDelete} title="삭제" style={{ marginLeft: '10px' }}><span style={{ fontSize: '1.2em' }}>🗑️</span></button>
                            </div>
                        )}
                    </div>
                    
                    {/* 3. 내용 */}
                    <p style={{ marginTop: '15px', color: '#aaaaaa' }}>{project.description}</p>
                </div>
                
                {/* 4. 진척도 섹션 */}
                <div className="detail-card progress-section">
                    <h3>진척도</h3>
                    <div className="progress-info">
                        <span>전체 진행률</span>
                        <span>{calculatedProgress}%</span>
                    </div>
                    <div className="progress-bar-container">
                        <div 
                            className="progress-bar" 
                            style={{ width: `${calculatedProgress}%` }}
                        ></div>
                    </div>
                </div>
                
                {/* ========================================================== */}
                {/* 💡 7. 첨부 파일 섹션 추가 (파일 목록 조회 및 다운로드 UI) */}
                <div className="detail-card file-section">
                    <h3>첨부 파일</h3>
                    <ul className="file-list">
                        {/* attachedFiles 필드가 존재하고 1개 이상일 때 목록 렌더링 */}
                        {(project.attachedFiles && project.attachedFiles.length > 0) ? (
                            project.attachedFiles.map(file => (
                                <li key={file.fileId}>
                                    {/* 다운로드 API 엔드포인트에 연결: GET /detail/files/{fileId} */}
                                    <a 
                                        href={`${API_BASE_URL}/files/${file.fileId}`} 
                                    >
                                        📄 {file.fileName}
                                    </a>
                                </li>
                            ))
                        ) : (
                            <li style={{ color: '#aaaaaa', listStyle: 'none' }}>
                                업로드된 파일이 없습니다.
                            </li>
                        )}
                    </ul>
                </div>
                {/* ========================================================== */}

                {/* 6. 작업 목록 (Todo list) 섹션 */}
                <div className="detail-card task-list">
                    <h3>해야 할 것 (작업 목록)</h3>
                    <ul>
                        {(project.workList || []).map(task => (    
                            <li key={task.taskId}>
                                <button 
                                    className={`round-button ${task.status === 'COMPLETED' ? 'completed' : 'in-progress'}`}
                                    onClick={() => handleTaskStatusToggle(task.taskId, task.status)}
                                    disabled={!hasTaskPermission}
                                >
                                    {task.status === 'COMPLETED' ? '✓' : ''}
                                </button>
                                <span style={{ textDecoration: task.status === 'COMPLETED' ? 'line-through' : 'none' }}>
                                    {task.taskName}
                                    {task.assignedUserName && (
                                        <div style={{ fontSize: '0.85rem', color: '#7a7a9a' }}>
                                            담당: {task.assignedUserName}
                                        </div>
                                    )}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
                
            </div> {/* .main-content 종료 */}


            {/* 우측 사이드바 (팀 정보, 채팅) */}
            <div className="sidebar">
                
                {/* 5. 팀 정보 섹션 */}
                <div className="detail-card team-info-section">
                    <h3>팀 정보</h3>
                    <div className="info-item">
                        <strong>담당자</strong>
                        {project.managerName}
                    </div>
                    
                    {/* 협업자 목록 분리 */}
                    {(project.coWorkers || []).map(w => (
                        <div key={w.userId} className="info-item">
                            <strong>협업자</strong>
                            {w.displayName}
                        </div>
                    ))}
                </div>

                {/* 7. 채팅 섹션 */}
                {projectStatus === '진행중' && (
                    <div className="detail-card chat-section">
                        <h3>채팅</h3>
                        <Chat 
                            projectId={projectId} 
                            currentUser={currentUser} 
                            isChatEnabled={isProjectManager || isCoWorker}
                        />
                    </div>
                )}
            </div> {/* .sidebar 종료 */}

        </div>
    );
}

export default Detail;