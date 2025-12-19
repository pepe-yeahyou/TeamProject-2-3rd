import React, { useState, useEffect } from 'react';
import '../styles/write.css'; // 아래에 CSS 파일 내용도 포함했습니다.
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Write = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();

    // 상태 관리
    const [projectData, setProjectData] = useState({
        projectTitle: '',
        description: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });

    const [authState, setAuthState] = useState({ isAuthenticated: false });
    const [selectedMembers, setSelectedMembers] = useState(new Map());
    const [tasks, setTasks] = useState([]); // 이미지의 '해야할 것' 목록
    const [newTaskInput, setNewTaskInput] = useState(''); // 할 일 입력 필드
    const [allUsers, setAllUsers] = useState([]);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('jwt_token');
        const displayName = localStorage.getItem('display_name');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setAuthState({ token, userId: payload.userId, displayName, isAuthenticated: true });
                loadAllUsers(token);
            } catch (e) { handleLogout(); }
        } else { navigate('/login'); }
    }, []);

    const loadAllUsers = async (token) => {
        try {
            const res = await fetch('/api/users', { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            setAllUsers(data.users || []);
        } catch (e) { console.error(e); }
    };

    const handleLogout = () => { logout(); navigate('/login'); };

    // 태그형 업무 추가 (이미지의 + 추가 버튼 로직)
    const handleAddTask = () => {
        if (!newTaskInput.trim()) return;
        setTasks([...tasks, { id: Date.now(), name: newTaskInput.trim() }]);
        setNewTaskInput('');
    };

    const removeTask = (id) => setTasks(tasks.filter(t => t.id !== id));

    const toggleMember = (user) => {
        const newMap = new Map(selectedMembers);
        if (newMap.has(user.userId)) newMap.delete(user.userId);
        else newMap.set(user.userId, user);
        setSelectedMembers(newMap);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isCreating) return;
        setIsCreating(true);

        const payload = {
            ...projectData,
            invitedUserIds: Array.from(selectedMembers.keys()),
            initialTasks: tasks.map(t => ({ taskName: t.name, description: '', assignedUserId: null }))
        };

        try {
            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authState.token}` },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                const result = await res.json();
                navigate(`/detail/${result.projectId}`);
            }
        } catch (e) { alert("생성 실패"); }
        finally { setIsCreating(false); }
    };

    return (
        <div className="write-page-dark">
            <div className="write-container">
                <header className="write-header">
                    <h2>글쓰기화면#1</h2>
                </header>

                <form className="project-form-dark" onSubmit={handleSubmit}>
                    {/* 프로젝트 제목 */}
                    <div className="input-section">
                        <input 
                            className="main-title-input"
                            placeholder="모바일 앱 개발"
                            value={projectData.projectTitle}
                            onChange={e => setProjectData({...projectData, projectTitle: e.target.value})}
                        />
                    </div>

                    {/* 프로젝트 내용 */}
                    <div className="input-section">
                        <label>프로젝트 내용</label>
                        <textarea 
                            className="main-textarea"
                            placeholder="신규 모바일 애플리케이션 개발 프로젝트"
                            value={projectData.description}
                            onChange={e => setProjectData({...projectData, description: e.target.value})}
                        />
                    </div>

                    {/* 해야할 것 (태그 리스트) */}
                    <div className="input-section">
                        <label>해야할 것</label>
                        <div className="task-tag-list">
                            {tasks.map(task => (
                                <div key={task.id} className="task-tag">
                                    <span>{task.name}</span>
                                    <button type="button" onClick={() => removeTask(task.id)}>×</button>
                                </div>
                            ))}
                        </div>
                        <div className="add-task-row">
                            <input 
                                className="sub-input"
                                placeholder="새 작업 추가"
                                value={newTaskInput}
                                onChange={e => setNewTaskInput(e.target.value)}
                                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddTask())}
                            />
                            <button type="button" className="add-btn" onClick={handleAddTask}>+ 추가</button>
                        </div>
                    </div>

                    {/* 협업자 배정 */}
                    <div className="input-section">
                        <label>협업자 배정</label>
                        <div className="member-grid">
                            {allUsers.map(user => (
                                <div 
                                    key={user.userId} 
                                    className={`member-card ${selectedMembers.has(user.userId) ? 'active' : ''}`}
                                    onClick={() => toggleMember(user)}
                                >
                                    <div className="checkbox-custom"></div>
                                    <span>{user.displayName}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 파일 첨부 */}
                    <div className="input-section">
                        <label>파일 첨부</label>
                        <div className="file-upload-box">
                            <button type="button" className="file-btn">
                                📤 파일 선택
                            </button>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="submit-btn" disabled={isCreating}>
                            {isCreating ? "생성 중..." : "프로젝트 생성"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Write;