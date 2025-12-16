// src/component/Detail.js

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
    // 이 부분은 컴포넌트 상단에서 정의되지만, 실제 값은 비동기 로딩 후 두 번째 렌더링에서 확정됩니다.
    const coWorkers = project?.coWorkers || []; 
    // 🚨 핵심: project가 있을 때만 managerId 접근. (이전 오류 해결)
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
            setProject(response.data);
            setError(null);
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
        // hasEditPermission 변수는 비동기 로드 후 계산되므로, 여기서는 project가 null인지 다시 확인
        if (!project || !hasEditPermission) return alert('프로젝트 수정 권한이 없거나 데이터 로딩 중입니다.');
        
        // /write 페이지로 이동하면서, 현재 project 데이터를 state로 전달
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
            // API: POST /detail/{projectId}?operation=DELETE (DELETE를 POST로 처리)
            await axios.post(`${API_BASE_URL}/${projectId}?operation=DELETE`); 
            
            alert('프로젝트가 성공적으로 삭제되었습니다.');
            // 삭제 후 메인 페이지로 이동
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
            console.log('------------------------------');
        }
    }, [project, currentUser.userId, hasEditPermission]);
    

    // ---------------------- 렌더링 시작 ----------------------

    if (loading) return <div>로딩 중...</div>;
    if (error) return <div>오류: {error}</div>;
    // 💡 [필수] project가 null일 경우 이 시점에서 렌더링 중단
    if (!project) return <div>프로젝트를 찾을 수 없습니다.</div>; 


    // 이 시점에서는 project가 존재하므로 안전하게 접근 가능
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
                                    {/* 💡 담당자 정보 추가 (만약 TaskVO에 assignedUserName이 있다면) */}
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
                        {/* 💡 Chat 컴포넌트에 CSS 클래스를 적용하거나 내부 Chat.js 파일에 스타일 적용 필요 */}
                        <Chat 
                            projectId={projectId} 
                            currentUser={currentUser} 
                            isChatEnabled={isProjectManager || isCoWorker}
                            // Chat 컴포넌트가 messages를 받아서 렌더링한다고 가정
                            // messages={dummyChatMessages} 
                        />
                    </div>
                )}
            </div> {/* .sidebar 종료 */}

        </div>
    );
}

export default Detail;