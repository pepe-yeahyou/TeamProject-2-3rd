import React, { useState, useEffect, useCallback } from 'react';
import axios from '../api/axios';
import Chat from './Chat';
import { useParams, useNavigate } from 'react-router-dom';
import '../css/Detail.css';

const API_BASE_URL = 'http://localhost:8484/detail';

/* ✅ JWT 파싱 유틸 (추가) */
const parseJwt = (token) => {
    try {
        const base64Payload = token.split('.')[1];
        return JSON.parse(atob(base64Payload));
    } catch (e) {
        return null;
    }
};

const calculateProgress = (workList) => {
    const totalTasks = workList.length;
    const completedTasks = workList.filter(task => task.status === 'COMPLETED').length;
    return totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
};

function Detail() {
    const { projectId } = useParams();
    const navigate = useNavigate();

    /* =========================
       ✅ 하드코딩 제거 → 실제 로그인 유저
       ========================= */
    const token = localStorage.getItem('jwt_token');
    const decodedToken = token ? parseJwt(token) : null;

    const currentUser = decodedToken
        ? {
            userId: decodedToken.userId,
            displayName: localStorage.getItem('display_name'),
            isLoggedIn: true,
        }
        : null;

    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 💡 [추가] 기간 만료 체크 로직
    const isExpired =
        project?.endDate &&
        new Date(project.endDate) < new Date().setHours(0, 0, 0, 0);

    const coWorkers = project?.coWorkers || [];
    const isProjectManager =
        project && currentUser && project.ownerId === currentUser.userId;
    const isCoWorker =
        currentUser && coWorkers.some(worker => worker.userId === currentUser.userId);

    // 💡 [수정] 권한 변수
    const hasTaskPermission = (isProjectManager || isCoWorker) && !isExpired;
    const hasEditPermission = isProjectManager;

    const fetchProjectDetail = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/${projectId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
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
        fetchProjectDetail();
    }, [fetchProjectDetail]);

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

        const projectDataForUpdate = {
            projectId: project.projectId,
            projectTitle: project.title,
            description: project.description,
            startDate: project.startDate,
            endDate: project.endDate,
        };

        navigate('/write', {
            state: {
                projectData: projectDataForUpdate,
                isEditMode: true,
            },
        });
    };

    const handleDelete = async () => {
        if (!hasEditPermission) return alert('프로젝트 삭제 권한이 없습니다.');
        if (!window.confirm('프로젝트를 삭제하시겠습니까?')) return;

        try {
            await axios.post(`${API_BASE_URL}/${projectId}?operation=DELETE`);
            alert('프로젝트가 성공적으로 삭제되었습니다.');
            navigate('/');
        } catch (err) {
            alert('프로젝트 삭제에 실패했습니다.');
            console.error(err);
        }
    };

    const handleTaskStatusToggle = async (taskId, currentStatus) => {
        if (isExpired) return alert('기간이 만료된 프로젝트는 수정할 수 없습니다.');
        if (!hasTaskPermission) return alert('작업 상태 변경 권한이 없습니다.');

        const isCompleted = currentStatus !== 'COMPLETED';
        const confirmMessage = isCompleted ? '완료' : '진행중';

        if (!window.confirm(`작업 상태를 [${confirmMessage}]으로 변경하시겠습니까?`))
            return;

        try {
            await axios.post(
                `${API_BASE_URL}/${projectId}/task/${taskId}?isCompleted=${isCompleted}`
            );

            const newWorkList = project.workList.map(task =>
                task.taskId === taskId
                    ? { ...task, status: isCompleted ? 'COMPLETED' : 'IN_PROGRESS' }
                    : task
            );

            const newProgress = calculateProgress(newWorkList);
            if (isProjectManager) {
                await handleProgressUpdate(newProgress);
            }

            setProject(prev => ({
                ...prev,
                workList: newWorkList,
                progress: newProgress,
            }));
        } catch (err) {
            alert('작업 상태 변경에 실패했습니다.');
            console.error(err);
        }
    };

    if (loading) return <div>로딩 중...</div>;
    if (error) return <div>오류: {error}</div>;
    if (!currentUser) return <div>로그인이 필요합니다.</div>;
    if (!project) return <div>프로젝트를 찾을 수 없습니다.</div>;

    const calculatedProgress = calculateProgress(project.workList || []);
    let projectStatus =
        calculatedProgress === 100 ? '완료' : isExpired ? '기간만료' : '진행중';

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
                                <button onClick={handleEditClick} title="수정">✏️</button>
                                <button onClick={handleDelete} title="삭제" style={{ marginLeft: '10px' }}>🗑️</button>
                            </div>
                        )}
                    </div>

                    <div className="project-period">
                        <h4>기간: {project.startDate || '미설정'} ~ {project.endDate || '미설정'}</h4>
                    </div>

                    <p>{project.description}</p>
                </div>

                <div className="detail-card task-list">
                    <h3>해야 할 것 (작업 목록)</h3>
                    <ul>
                        {project.workList.map(task => (
                            <li key={task.taskId}>
                                <button
                                    className={`round-button ${task.status === 'COMPLETED' ? 'completed' : 'in-progress'}`}
                                    onClick={() => handleTaskStatusToggle(task.taskId, task.status)}
                                    disabled={!hasTaskPermission || isExpired}
                                >
                                    {task.status === 'COMPLETED' ? '✓' : ''}
                                </button>
                                <span style={{ textDecoration: task.status === 'COMPLETED' ? 'line-through' : 'none' }}>
                                    {task.taskName}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="sidebar">
                <div className="detail-card team-info-section">
                    <h3>팀 정보</h3>
                    <div className="info-item">
                        <strong>담당자</strong> {project.managerName}
                    </div>
                    {project.coWorkers.map(w => (
                        <div key={w.userId} className="info-item">
                            <strong>협업자</strong> {w.displayName}
                        </div>
                    ))}
                </div>

                {projectStatus === '진행중' ? (
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
                        <h4>
                            {projectStatus === '완료'
                                ? '해당 프로젝트는 완료되었습니다.'
                                : '기간이 만료되어 채팅이 불가합니다.'}
                        </h4>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Detail;
