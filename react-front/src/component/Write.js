import React, { useState, useEffect, useRef } from 'react';
import '../css/write.css'; 
import { useNavigate, useLocation } from "react-router-dom"; 
import { useAuth } from "../context/AuthContext";

const Write = () => {
    const navigate = useNavigate();
    const location = useLocation(); 
    const { logout } = useAuth();

    // Detail.js에서 넘겨준 수정 데이터 확인
    const editData = location.state?.projectData;
    const isEditMode = !!location.state?.isEditMode;

    // 1. 프로젝트 기본 데이터 상태 (기존 로직 유지 + 수정 데이터 반영)
    const [projectData, setProjectData] = useState({
        projectTitle: editData?.projectTitle || '',
        description: editData?.description || '',
        startDate: editData?.startDate || new Date().toISOString().split('T')[0],
        endDate: editData?.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });

    const [authState, setAuthState] = useState({ isAuthenticated: false, userId: null, token: null });
    const [selectedMembers, setSelectedMembers] = useState(new Map()); 
    const [tasks, setTasks] = useState([]); 
    const [newTaskInput, setNewTaskInput] = useState(''); 
    const [selectedTaskUser, setSelectedTaskUser] = useState(''); 
    
    const [searchQuery, setSearchQuery] = useState(''); 
    const [searchResults, setSearchResults] = useState([]); 
    const [allUsers, setAllUsers] = useState([]); 
    const [showDropdown, setShowDropdown] = useState(false); 
    const [isCreating, setIsCreating] = useState(false);
    const dropdownRef = useRef(null);

    // [데이터 복구용 useEffect] - 수정 모드일 때 멤버와 태스크를 복원
    useEffect(() => {
        if (isEditMode && editData) {
            const newMap = new Map();
            if (editData.coWorkers) {
                editData.coWorkers.forEach(user => {
                    newMap.set(Number(user.userId), user);
                });
            }
            setSelectedMembers(newMap);

            if (editData.workList) {
                const recoveredTasks = editData.workList.map(task => ({
                    id: task.taskId || Date.now() + Math.random(),
                    name: task.taskName,
                    userId: Number(task.userId)
                }));
                setTasks(recoveredTasks);
            }
        }
    }, [isEditMode, editData]);

    useEffect(() => {
        const token = localStorage.getItem('jwt_token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const currentUserId = Number(payload.userId || payload.id);
                setAuthState({ token, userId: currentUserId, isAuthenticated: true });
                loadInitialUsers(token, currentUserId); 
            } catch (e) { handleLogout(); }
        } else { navigate('/login'); }
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadInitialUsers = async (token, currentUserId) => {
        try {
            const res = await fetch('/api/projects/users', { 
                headers: { 'Authorization': `Bearer ${token}` } 
            });
            const data = await res.json();
            const filtered = (data || []).filter(user => Number(user.userId) !== currentUserId);
            setAllUsers(filtered);
        } catch (e) { console.error(e); }
    };

    const handleSearch = async (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (!query.trim()) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }
        try {
            const res = await fetch(`/api/projects/users/search?query=${encodeURIComponent(query)}`, {
                headers: { 'Authorization': `Bearer ${authState.token}` }
            });
            const data = await res.json();
            const filtered = (data || []).filter(user => Number(user.userId) !== authState.userId);
            setSearchResults(filtered);
            setShowDropdown(true);
        } catch (e) { console.error(e); }
    };

    const addMember = (user) => {
        const userIdNum = Number(user.userId);
        if (!selectedMembers.has(userIdNum)) {
            const newMap = new Map(selectedMembers);
            newMap.set(userIdNum, user);
            setSelectedMembers(newMap);
        }
        setSearchQuery('');
        setShowDropdown(false);
    };

    const handleSelectChange = (e) => {
        const userId = e.target.value;
        if (!userId) return;
        const user = allUsers.find(u => String(u.userId) === userId);
        if (user) addMember(user);
        e.target.value = ""; 
    };

    const removeMember = (userId) => {
        const newMap = new Map(selectedMembers);
        newMap.delete(Number(userId));
        setSelectedMembers(newMap);
    };

    const handleLogout = () => { logout(); navigate('/login'); };

    const handleAddTask = () => {
        if (!newTaskInput.trim()) return;
        setTasks([...tasks, { 
            id: Date.now(), 
            name: newTaskInput.trim(), 
            userId: selectedTaskUser ? Number(selectedTaskUser) : authState.userId 
        }]);
        setNewTaskInput('');
    };

    const removeTask = (id) => setTasks(tasks.filter(t => t.id !== id));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isCreating) return;
        
        if (new Date(projectData.startDate) > new Date(projectData.endDate)) {
            return alert("종료일은 시작일보다 빠를 수 없습니다.");
        }
        if (!projectData.projectTitle.trim()) return alert("프로젝트 제목을 입력하세요.");

        setIsCreating(true);
        const payload = {
            projectTitle: projectData.projectTitle,
            description: projectData.description,
            startDate: projectData.startDate,
            endDate: projectData.endDate,
            memberList: Array.from(selectedMembers.values()).map(user => ({ userId: user.userId })),
            taskList: tasks.map(t => ({ taskName: t.name, userId: t.userId }))
        };

        try {
            // 수정 모드일 때는 detail API로, 생성일 때는 projects API로 전송
            let url = isEditMode 
                ? `http://localhost:8484/detail/${editData.projectId}` 
                : `/api/projects/${authState.userId}`;

            const res = await fetch(url, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${authState.token}` 
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert(isEditMode ? "수정되었습니다." : "생성되었습니다.");
                if (isEditMode) {
                    navigate(`/detail/${editData.projectId}`);
                } else {
                    const projectId = await res.json();
                    navigate(`/detail/${projectId}`);
                }
            } else {
                const errorText = await res.text();
                alert("요청 실패: " + errorText);
            }
        } catch (e) { 
            console.error("통신 에러:", e);
            alert("통신 실패"); 
        } finally { 
            setIsCreating(false); 
        }
    };

    return (
        <div className="write-page-dark">
            <div className="write-container">
                <header className="write-header">
                    <h2>{isEditMode ? "프로젝트 수정" : "새 프로젝트 생성"}</h2>
                </header>

                <form className="project-form-dark" onSubmit={handleSubmit}>
                    <div className="input-section">
                        <label>프로젝트 제목</label>
                        <input className="main-title-input" value={projectData.projectTitle}
                            onChange={e => setProjectData({...projectData, projectTitle: e.target.value})} />
                    </div>

                    <div className="input-section">
                        <label>시작일</label>
                        <input 
                            type="date" 
                            className="sub-input date-picker" 
                            value={projectData.startDate}
                            onChange={e => setProjectData(prev => ({...prev, startDate: e.target.value}))}
                            onClick={(e) => e.target.showPicker && e.target.showPicker()} 
                        />
                    </div>

                    <div className="input-section">
                        <label>종료일</label>
                        <input 
                            type="date" 
                            className="sub-input date-picker" 
                            value={projectData.endDate}
                            onChange={e => {
                                console.log("종료일 변경:", e.target.value);
                                setProjectData(prev => ({...prev, endDate: e.target.value}));
                            }}
                            onClick={(e) => e.target.showPicker && e.target.showPicker()} 
                        />
                    </div>

                    <div className="input-section">
                        <label>프로젝트 내용</label>
                        <textarea className="main-textarea" value={projectData.description}
                            onChange={e => setProjectData({...projectData, description: e.target.value})} />
                    </div>

                    <div className="input-section">
                        <label>해야할 것</label>
                        <div className="task-tag-list">
                            {tasks.map(task => (
                                <div key={task.id} className="task-tag">
                                    <span>
                                        <strong>[{selectedMembers.get(Number(task.userId))?.displayName || "리더"}]</strong> {task.name}
                                    </span>
                                    <button type="button" onClick={() => removeTask(task.id)}>×</button>
                                </div>
                            ))}
                        </div>
                        <div className="add-task-row" style={{ display: 'flex', gap: '5px' }}>
                            <select className="sub-input" style={{ flex: '0 0 120px' }} value={selectedTaskUser}
                                onChange={(e) => setSelectedTaskUser(e.target.value)}>
                                <option value="">본인(리더)</option>
                                {Array.from(selectedMembers.values()).map(user => (
                                    <option key={user.userId} value={user.userId}>{user.displayName}</option>
                                ))}
                            </select>
                            <input className="sub-input" style={{ flex: 1 }} placeholder="작업 내용 입력" value={newTaskInput} 
                                onChange={e => setNewTaskInput(e.target.value)}
                                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddTask())} />
                            <button type="button" className="add-btn" onClick={handleAddTask}>+ 추가</button>
                        </div>
                    </div>

                    <div className="input-section" style={{ position: 'relative' }} ref={dropdownRef}>
                        <label>협업자 배정</label>
                        <div className="search-select-row" style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                            <div style={{ flex: 1, position: 'relative' }}>
                                <input className="sub-input" placeholder="이름 검색..." value={searchQuery} onChange={handleSearch} />
                                {showDropdown && searchResults.length > 0 && (
                                    <ul className="search-dropdown">
                                        {searchResults.map(user => (
                                            <li key={user.userId} onClick={() => addMember(user)}>{user.displayName} ({user.username})</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <select className="sub-input" style={{ flex: 1 }} onChange={handleSelectChange} defaultValue="">
                                <option value="" disabled>전체 목록</option>
                                {allUsers.map(user => (
                                    <option key={user.userId} value={user.userId}>{user.displayName}</option>
                                ))}
                            </select>
                        </div>
                        <div className="task-tag-list">
                            {Array.from(selectedMembers.values()).map(user => (
                                <div key={user.userId} className="task-tag member-tag">
                                    <span>👤 {user.displayName}</span>
                                    <button type="button" onClick={() => removeMember(user.userId)}>×</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="submit-btn" disabled={isCreating}>
                            {isCreating ? "처리 중..." : (isEditMode ? "수정 완료" : "프로젝트 생성")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Write;