import React, { useState, useEffect, useRef } from 'react';
import '../css/write.css'; 
import { useNavigate, useLocation } from "react-router-dom"; 
import { useAuth } from "../context/AuthContext";
import { detailURL } from '../api/axios';

const Write = () => {
    const navigate = useNavigate();
    const location = useLocation(); 
    const { logout } = useAuth();

    // Detail.js에서 넘겨준 수정 데이터 확인
    const editData = location.state?.projectData;
    const isEditMode = !!location.state?.isEditMode;

    // 1. 프로젝트 기본 데이터 상태
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

    // ✅ [수정] 업무가 할당된 멤버는 삭제 불가능하게 체크
    const removeMember = (userId) => {
        const userIdNum = Number(userId);
        
        // 현재 task 리스트 중에 이 유저가 담당인 것이 있는지 확인
        const hasAssignedTask = tasks.some(task => Number(task.userId) === userIdNum);

        if (hasAssignedTask) {
            alert("해당 협업자에게 할당된 업무가 있습니다. 업무를 먼저 삭제하거나 담당자를 변경해주세요.");
            return;
        }

        const newMap = new Map(selectedMembers);
        newMap.delete(userIdNum);
        setSelectedMembers(newMap);
        
        // 만약 업무 담당자 선택 박스에 이 유저가 선택되어 있었다면 리셋
        if (Number(selectedTaskUser) === userIdNum) {
            setSelectedTaskUser('');
        }
    };

    // ✅ [추가] 취소 버튼 핸들러
    const handleCancel = () => {
        if (isEditMode && editData?.projectId) {
            navigate(`/detail/${editData.projectId}`);
        } else {
            navigate(-1);
        }
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
            projectTitle: String(projectData.projectTitle),
            description: String(projectData.description),
            startDate: projectData.startDate, 
            endDate: projectData.endDate,
            memberList: Array.from(selectedMembers.values()).map(user => ({ 
                userId: Number(user.userId) 
            })),
            taskList: tasks.map(t => ({ 
                taskName: String(t.name), 
                userId: Number(t.userId) 
            }))
        };

        try {
            let url = isEditMode 
                ? `${detailURL}/${editData.projectId}` 
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
                alert(isEditMode ? "수정 완료!" : "생성 완료!");
                navigate(`/detail/${isEditMode ? editData.projectId : await res.json()}`);
            } else {
                alert("서버 응답 에러: " + await res.text());
            }
        } catch (e) {
            console.error("통신 장애:", e);
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
                    
                    <div className="date-row">
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
                                onChange={e => setProjectData(prev => ({...prev, endDate: e.target.value}))}
                                onClick={(e) => e.target.showPicker && e.target.showPicker()} 
                            />
                        </div>
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

                    {/* ✅ [수정] 취소하기 / 수정완료 버튼 레이아웃 */}
                    <div className="form-actions">
                        <button type="submit" className="submit-btn" disabled={isCreating} style={{ flex: 2 }}>
                            {isCreating ? "처리 중..." : (isEditMode ? "수정 완료" : "프로젝트 생성")}
                        </button>
                        <button type="button" className="cancel-btn" onClick={handleCancel} style={{ flex: 2}}>
                            취소하기
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Write;