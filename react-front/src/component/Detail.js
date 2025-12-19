import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import Chat from './Chat';
import { useParams, useNavigate } from 'react-router-dom';
import '../css/Detail.css';

const API_BASE_URL = 'http://localhost:8484/detail';

/* ✅ JWT 파싱 유틸 */
const parseJwt = (token) => {
    if (!token) return null;
    try {
        const base64Payload = token.split('.')[1];
        const payload = JSON.parse(atob(base64Payload));
        console.log("Parsed JWT Payload:", payload); // 유저 ID 키값 확인용
        return payload;
    } catch (e) {
        console.error("JWT Parsing Error:", e);
        return null;
    }
};

/* ✅ 진척도 계산 로직 유지 */
const calculateProgress = (workList) => {
    if (!workList || workList.length === 0) return 0;
    const totalTasks = workList.length;
    const completedTasks = workList.filter(task => task.status === 'COMPLETED').length;
    return Math.round((completedTasks / totalTasks) * 100);
};

function Detail() {
    const { projectId } = useParams();
    const navigate = useNavigate();

    /* ✅ 실제 로그인 유저 정보 추출 (서버 DB의 유저 ID와 타입 일치 필수) */
    const token = localStorage.getItem('jwt_token') || localStorage.getItem('token');

    const currentUser = useMemo(() => {
        const decodedToken = token ? parseJwt(token) : null;
        if (!decodedToken) return null;

        return {
            // 서버 DB가 ID 7을 보낸다면, 여기서도 숫자 7이어야 함 (decodedToken의 ID 키값을 확인하세요)
            userId: decodedToken.userId ? Number(decodedToken.userId) : Number(decodedToken.id),
            userName: decodedToken.sub,
            displayName: localStorage.getItem('displayName') || "사용자",
            isLoggedIn: true,
        };
    }, [token]);

    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 💡 권한 체크 변수들
    const isExpired = project?.endDate && new Date(project.endDate) < new Date().setHours(0, 0, 0, 0);
    const coWorkers = project?.coWorkers || [];

    // 타입 불일치 방지를 위해 Number() 처리
    const isProjectManager = project && currentUser && Number(project.ownerId) === currentUser.userId;
    const isCoWorker = currentUser && coWorkers.some(worker => Number(worker.userId) === currentUser.userId);

    const hasTaskPermission = (isProjectManager || isCoWorker) && !isExpired;
    const hasEditPermission = isProjectManager;

    const fetchProjectDetail = useCallback(async () => {
        if (!token) return;
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/${projectId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setProject(response.data);
            setError(null);
        } catch (err) {
            setError('프로젝트 정보를 불러오는 데 실패했습니다.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [projectId, token]);

    useEffect(() => {
        if (token) {
            fetchProjectDetail();
        }
    }, [fetchProjectDetail, token]);

    const handleProgressUpdate = async (newProgress) => {
        if (!isProjectManager) return;
        try {
            const updatePayload = {
                projectTitle: project.title,
                description: project.description,
                startDate: project.startDate,
                endDate: project.endDate,
                coWorkers: project.coWorkers || [],
                workList: project.workList || [],
                managerName: project.managerName,
                progress: newProgress
            };

            await axios.post(`${API_BASE_URL}/${projectId}`, updatePayload, {
                headers: { Authorization: `Bearer ${token}` },
            });
        } catch (err) {
            console.error('진척도 업데이트 실패:', err);
        }
    };

    const handleEditClick = () => {
        if (!project || !hasEditPermission)
            return alert('프로젝트 수정 권한이 없거나 데이터 로딩 중입니다.');

        navigate('/write', {
            state: {
                projectData: {
                    projectId: project.projectId,
                    projectTitle: project.title,
                    description: project.description,
                    startDate: project.startDate,
                    endDate: project.endDate,
                },
                isEditMode: true,
            },
        });
    };

    const handleDelete = async () => {
        if (!hasEditPermission) return alert('프로젝트 삭제 권한이 없습니다.');
        if (!window.confirm('프로젝트를 삭제하시겠습니까?')) return;

        try {
            await axios.post(`${API_BASE_URL}/${projectId}?operation=DELETE`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('프로젝트가 성공적으로 삭제되었습니다.');
            navigate('/');
        } catch (err) {
            alert('프로젝트 삭제에 실패했습니다.');
        }
    };

    const handleTaskStatusToggle = async (taskId, currentStatus) => {
        if (isExpired) return alert('기간이 만료된 프로젝트는 수정할 수 없습니다.');

        // 현재 로컬에서 판단하는 권한 체크 (서버 SecurityException 방어)
        if (!hasTaskPermission) {
            console.log("현재 접속 유저 ID:", currentUser?.userId);
            console.log("매니저 여부:", isProjectManager);
            console.log("협업자 여부:", isCoWorker);
            return alert('작업 상태 변경 권한이 없습니다. (담당자 또는 협업자만 가능)');
        }

        const isCompleted = currentStatus !== 'COMPLETED';
        if (!window.confirm(`작업 상태를 변경하시겠습니까?`)) return;

        try {
            // ✅ 서버 컨트롤러가 요구하는 형식: @PostMapping("/{projectId}/task/{taskId}")
            await axios.post(
                `${API_BASE_URL}/${projectId}/task/${taskId}?isCompleted=${isCompleted}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // 로컬 상태 업데이트
            const newWorkList = (project.workList || []).map(task =>
                task.taskId === taskId
                    ? { ...task, status: isCompleted ? 'COMPLETED' : 'IN_PROGRESS' }
                    : task
            );

            const newProgress = calculateProgress(newWorkList);

            if (isProjectManager) {
                 await handleProgressUpdate(newProgress);
            }

            setProject(prevProject => ({
                ...prevProject,
                workList: newWorkList,
                progressPercentage: newProgress
            }));

        } catch (err) {
            // 서버의 SecurityException 메시지를 직접 표시
            const serverMessage = err.response?.data;
            console.error('서버 에러 응답:', serverMessage);
            alert(`변경 실패: ${serverMessage || '권한이 없거나 서버 오류입니다.'}`);
        }
    };

    if (loading) return <div className="loading">로딩 중...</div>;
    if (error) return <div className="error">오류: {error}</div>;
    if (!currentUser) return <div className="auth-error">로그인이 필요합니다.</div>;
    if (!project) return <div className="not-found">프로젝트를 찾을 수 없습니다.</div>;

    const currentProgress = project.progressPercentage || calculateProgress(project.workList || []);
    let projectStatus = project.status || (currentProgress === 100 ? '완료' : (isExpired ? '기간만료' : '진행중'));

    return (
        <div className="detail-page">
            <div className="main-content">
                <div className="detail-card title-section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h2>
                            {project.title}
                            <span className={`status-${projectStatus}`}>{projectStatus}</span>
                        </h2>
                        {hasEditPermission && (
                            <div className="action-buttons">
                                <button onClick={handleEditClick} className="icon-btn">✏️</button>
                                <button onClick={handleDelete} className="icon-btn" style={{ marginLeft: '10px' }}>🗑️</button>
                            </div>
                        )}
                    </div>
                    <div className="project-period" style={{ marginTop: '10px' }}>
                        <h4>기간: {project.startDate} ~ {project.endDate}</h4>
                    </div>
                    <p style={{ marginTop: '15px' }}>{project.description}</p>
                </div>

                <div className="detail-card progress-section">
                    <h3>진척도</h3>
                    <div className="progress-info">
                        <span>전체 진행률</span>
                        <span>{currentProgress}%</span>
                    </div>
                    <div className="progress-bar-container">
                        <div className="progress-bar" style={{ width: `${currentProgress}%` }}></div>
                    </div>
                </div>

                <div className="detail-card task-list">
                    <h3>해야 할 것 (작업 목록)</h3>
                    <ul>
                        {(project.workList || []).map(task => (
                            <li key={task.taskId}>
                                <button
                                    className={`round-button ${task.status === 'COMPLETED' ? 'completed' : 'in-progress'}`}
                                    onClick={() => handleTaskStatusToggle(task.taskId, task.status)}
                                >
                                    {task.status === 'COMPLETED' ? '✓' : ''}
                                </button>
                                <span style={{ textDecoration: task.status === 'COMPLETED' ? 'line-through' : 'none' }}>
                                    {task.taskName}
                                    {task.assignedUserName && (
                                        <div className="task-assignee">담당: {task.assignedUserName}</div>
                                    )}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="sidebar">
                <div className="detail-card team-info-section">
                    <h3>팀 정보</h3>
                    <div className="info-item"><strong>담당자</strong> {project.managerName}</div>
                    {(project.coWorkers || []).map(w => (
                        <div key={w.userId} className="info-item">
                            <strong>협업자</strong> {w.displayName}
                        </div>
                    ))}
                </div>

                {project.isChatActive !== false ? (
                    <div className="detail-card chat-section">
                        <h3>채팅</h3>
                        <Chat
                            projectId={projectId}
                            currentUser={currentUser}
                            isChatEnabled={hasTaskPermission}
                        />
                    </div>
                ) : (
                    <div className="detail-card completion-message">
                        <h4>프로젝트가 활성 상태가 아닙니다.</h4>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Detail;