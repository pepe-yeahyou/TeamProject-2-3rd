import React, { useState, useEffect } from 'react';
import '../styles/write.css'
import {useNavigate} from "react-router-dom";

const Write = () => {

    const navigate = useNavigate();

    // 날짜 포맷팅 함수
    const formatDate = (date) => {
        return date.toISOString().split('T')[0];
    };

    // 오늘과 다음 주 날짜 계산
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    // 상태 관리
    const [projectData, setProjectData] = useState({
        projectTitle: '',
        description: '',
        startDate: formatDate(today),
        endDate: formatDate(nextWeek)
    });

    // 로그인된 사용자 정보
    const [currentUser, setCurrentUser] = useState({
        userId: null,
        username: null,
        displayName: null,
        isLoggedIn: false
    });

    const [selectedMembers, setSelectedMembers] = useState(new Map());
    const [tasks, setTasks] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [nextTaskId, setNextTaskId] = useState(1);
    const [isSearching, setIsSearching] = useState(false);

    // 컴포넌트 마운트 시 로그인 정보 불러오기
    useEffect(() => {
        const userId = localStorage.getItem('currentUserId');
        const username = localStorage.getItem('currentUsername');
        const displayName = localStorage.getItem('currentDisplayName');
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

        if (isLoggedIn && userId) {
            setCurrentUser({
                userId: parseInt(userId),
                username,
                displayName,
                isLoggedIn: true
            });

            // 로그인된 사용자를 selectedMembers에 추가 (팀장)
            const newSelectedMembers = new Map();
            newSelectedMembers.set(parseInt(userId), {
                userId: parseInt(userId),
                displayName: `${displayName} (나)`,
                username: username,
                isLeader: true
            });
            setSelectedMembers(newSelectedMembers);
        } else {
            alert('로그인이 필요합니다. 개발자도구 → Application → Local Storage에 로그인 정보를 추가해주세요.');
        }
    }, []);

    // 선택된 멤버 수 계산 (본인 제외)
    const selectedMemberCount = Array.from(selectedMembers.keys())
        .filter(id => id !== currentUser.userId).length;

    // 사용자 검색 함수
    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);

        try {
            const response = await fetch(`/api/users/search?query=${encodeURIComponent(searchQuery)}`);

            if (!response.ok) {
                throw new Error('검색 요청 실패');
            }

            const data = await response.json();
            setSearchResults(data.users || []);
        } catch (error) {
            console.error('검색 에러:', error);
            setSearchResults([]);
            alert('사용자 검색에 실패했습니다.');
        } finally {
            setIsSearching(false);
        }
    };

    // 엔터키로 검색
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearch();
        }
    };

    // 팀원 선택/해제
    const toggleMemberSelection = (user) => {
        // 본인은 선택/해제 불가
        if (user.userId === currentUser.userId) return;

        const newSelectedMembers = new Map(selectedMembers);

        if (newSelectedMembers.has(user.userId)) {
            newSelectedMembers.delete(user.userId);
        } else {
            newSelectedMembers.set(user.userId, {
                userId: user.userId,
                displayName: user.displayName,
                username: user.username,
                isLeader: false
            });
        }

        setSelectedMembers(newSelectedMembers);
    };

    // 팀원 제거
    const removeMember = (userId) => {
        // 본인은 제거 불가
        if (userId === currentUser.userId) return;

        const newSelectedMembers = new Map(selectedMembers);
        newSelectedMembers.delete(userId);
        setSelectedMembers(newSelectedMembers);
    };

    // 업무 추가
    const addTask = () => {
        const newTask = {
            id: nextTaskId,
            taskName: '',
            assigneeId: currentUser.userId || 0
        };

        setTasks([...tasks, newTask]);
        setNextTaskId(nextTaskId + 1);
    };

    // 업무 제목 변경
    const updateTaskName = (taskId, newTaskName) => {
        setTasks(tasks.map(task =>
            task.id === taskId ? {...task, taskName: newTaskName} : task
        ));
    };

    // 업무 담당자 변경
    const updateTaskAssignee = (taskId, assigneeId) => {
        setTasks(tasks.map(task =>
            task.id === taskId ? {...task, assigneeId: parseInt(assigneeId)} : task
        ));
    };

    // 업무 삭제
    const deleteTask = (taskId) => {
        setTasks(tasks.filter(task => task.id !== taskId));
    };

    // 폼 제출 처리
    const handleSubmit = async (e) => {
        e.preventDefault();

        // 로그인 검증
        if (!currentUser.isLoggedIn) {
            alert('로그인이 필요합니다.');
            return;
        }

        // 유효성 검사
        if (!projectData.projectTitle.trim()) {
            alert('프로젝트 이름을 입력해주세요.');
            return;
        }

        if (new Date(projectData.startDate) > new Date(projectData.endDate)) {
            alert('시작일은 마감일보다 빨라야 합니다.');
            return;
        }

        // 데이터 준비
        const invitedUserIds = Array.from(selectedMembers.keys())
            .filter(id => id !== currentUser.userId);

        const initialTasks = tasks
            .filter(task => task.taskName.trim())
            .map(task => ({
                taskName: task.taskName.trim(),
                description: '',
                assignedUserId: task.assigneeId === currentUser.userId ? null : task.assigneeId
            }));

        const projectDataToSend = {
            projectTitle: projectData.projectTitle,
            description: projectData.description,
            startDate: projectData.startDate,
            endDate: projectData.endDate,
            invitedUserIds,
            initialTasks
        };

        console.log('전송할 데이터:', projectDataToSend);

        // API 호출
        try {
            const response = await fetch('/api/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id': currentUser.userId.toString()
                },
                body: JSON.stringify(projectDataToSend)
            });

            if (response.ok) {
                const result = await response.json();
                navigate(`/detail/${result.projectId}`);
            } else {
                const error = await response.text();
                alert('서버 오류: ' + error);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('서버 연결에 실패했습니다.');
        }
    };

    // 담당자 옵션 생성
    const getAssigneeOptions = () => {
        const options = [];

        // 로그인된 본인 추가
        if (currentUser.userId) {
            options.push({
                value: currentUser.userId,
                label: `${currentUser.displayName} (나)`
            });
        }

        // 선택된 팀원들 추가
        selectedMembers.forEach((member, id) => {
            if (id !== currentUser.userId) {
                options.push({
                    value: id,
                    label: `${member.displayName}`
                });
            }
        });

        return options;
    };

    // 선택된 팀원 목록 HTML 생성
    const renderSelectedMembers = () => {
        const members = [];

        selectedMembers.forEach((member, id) => {
            if (id === currentUser.userId) {
                members.push(
                    <div key={id}>
                        나 ({currentUser.displayName}, 프로젝트 생성자, 팀장)
                    </div>
                );
            } else {
                members.push(
                    <div key={id}>
                        • {member.displayName} (@{member.username})
                    </div>
                );
            }
        });

        return members;
    };

    return (
        <>
            {/* 네비게이션 바 추가 */}
            <nav className="navbar">
                <a href="/main" className="nav-brand">
                    <div className="brand-icon">P</div>
                    <span>Project Manager</span>
                </a>

                {currentUser.isLoggedIn && (
                    <div className="user-info">
                        <div className="user-avatar">
                            {currentUser.displayName?.substring(0, 2) || '??'}
                        </div>
                        <div className="user-details">
                            <span className="user-name">{currentUser.displayName}</span>
                        </div>
                        <button
                            className="logout-btn"
                            onClick={() => {
                                localStorage.clear();
                                window.location.href = '/login';
                            }}
                        >
                            로그아웃
                        </button>
                    </div>
                )}
            </nav>

            <div className="container">
                {/* 헤더 수정 - 불필요한 로그인 정보 제거 */}
                <div className="header">
                    <h1 className="title">새 프로젝트 생성</h1>
                    <p className="subtitle">
                        회원 검색으로 팀원을 초대하고 업무를 배정하세요
                    </p>
                </div>

                <div className="form-card">
                    <form id="projectForm" onSubmit={handleSubmit}>
                        {/* 프로젝트 기본 정보 */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="projectName">
                                프로젝트 이름
                            </label>
                            <input
                                type="text"
                                id="projectName"
                                className="form-input"
                                placeholder="프로젝트 이름"
                                value={projectData.projectTitle}
                                onChange={(e) => setProjectData({...projectData, projectTitle: e.target.value})}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="projectDescription">
                                프로젝트 설명
                            </label>
                            <textarea
                                id="projectDescription"
                                className="form-textarea"
                                placeholder="프로젝트 설명"
                                value={projectData.description}
                                onChange={(e) => setProjectData({...projectData, description: e.target.value})}
                            />
                        </div>

                        <div className="date-row">
                            <div className="date-group">
                                <label className="form-label" htmlFor="startDate">
                                    시작일
                                </label>
                                <input
                                    type="date"
                                    id="startDate"
                                    className="date-input"
                                    value={projectData.startDate}
                                    onChange={(e) => setProjectData({...projectData, startDate: e.target.value})}
                                    required
                                />
                            </div>

                            <div className="date-group">
                                <label className="form-label" htmlFor="endDate">
                                    마감일
                                </label>
                                <input
                                    type="date"
                                    id="endDate"
                                    className="date-input"
                                    value={projectData.endDate}
                                    onChange={(e) => setProjectData({...projectData, endDate: e.target.value})}
                                    required
                                />
                            </div>
                        </div>

                        {/* 팀원 검색 섹션 */}
                        <div className="form-group">
                            <label className="form-label">
                                팀원 검색 및 선택
                                <span className="selected-count">선택됨: {selectedMemberCount}명</span>
                            </label>
                            <div className="team-search">
                                <p className="search-info">
                                    이미 가입된 회원을 검색하여 팀원으로 초대하세요.
                                </p>

                                <div className="search-row">
                                    <input
                                        type="text"
                                        id="searchQuery"
                                        className="search-input"
                                        placeholder="이름 또는 사용자명으로 검색"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                    />
                                    <button
                                        type="button"
                                        className="search-btn"
                                        onClick={handleSearch}
                                    >
                                        검색
                                    </button>
                                </div>

                                <div className="team-list" id="teamList">
                                    {isSearching ? (
                                        <div className="loading-message">검색 중...</div>
                                    ) : searchResults.length === 0 ? (
                                        <div className="search-placeholder">
                                            {searchQuery ? '검색 결과가 없습니다.' : '검색어를 입력하여 회원을 찾아보세요.'}
                                        </div>
                                    ) : (
                                        searchResults.map(user => {
                                            const isSelected = selectedMembers.has(user.userId);
                                            const isCurrentUser = user.userId === currentUser.userId;
                                            return (
                                                <div
                                                    key={user.userId}
                                                    className={`team-member ${isSelected ? 'selected' : ''} ${isCurrentUser ? 'current-user' : ''}`}
                                                    onClick={() => !isCurrentUser && toggleMemberSelection(user)}
                                                >
                                                    <div className="member-info">
                                                        <div className="member-avatar">
                                                            {user.displayName?.substring(0, 2) || '??'}
                                                        </div>
                                                        <div className="member-details">
                                                            <div className="member-name">{user.displayName}</div>
                                                            <div className="member-username">@{user.username}</div>
                                                        </div>
                                                    </div>
                                                    {isSelected && !isCurrentUser && (
                                                        <button
                                                            type="button"
                                                            className="delete-btn"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                removeMember(user.userId);
                                                            }}
                                                        >
                                                            ✕
                                                        </button>
                                                    )}
                                                    {isCurrentUser && (
                                                        <span className="current-user-badge">나</span>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            <div className="selected-members-container">
                                <strong className="selected-label">선택된 팀원:</strong>
                                <div id="selectedMembersList" className="selected-members-list">
                                    {renderSelectedMembers()}
                                </div>
                            </div>
                        </div>

                        {/* 업무 배정 섹션 */}
                        <div className="form-group">
                            <div className="task-header">
                                <label className="form-label">
                                    초기 업무 배정
                                </label>
                                <button
                                    type="button"
                                    className="add-task-btn-small"
                                    onClick={addTask}
                                    title="업무 추가"
                                >
                                    추가
                                </button>
                            </div>
                            <div className="task-assignment">
                                <p className="task-info">
                                    업무를 추가하고 선택된 팀원에게 배정하세요.
                                </p>

                                <div className="task-list" id="taskList">
                                    {tasks.map(task => {
                                        const assigneeOptions = getAssigneeOptions();
                                        return (
                                            <div key={task.id} className="task-row">
                                                <input
                                                    type="text"
                                                    className="task-input"
                                                    placeholder="업무 제목"
                                                    value={task.taskName}
                                                    onChange={(e) => updateTaskName(task.id, e.target.value)}
                                                />
                                                <select
                                                    className="assignee-select"
                                                    value={task.assigneeId}
                                                    onChange={(e) => updateTaskAssignee(task.id, e.target.value)}
                                                >
                                                    {assigneeOptions.map(option => (
                                                        <option key={option.value} value={option.value}>
                                                            {option.label}
                                                        </option>
                                                    ))}
                                                </select>
                                                <button
                                                    type="button"
                                                    className="delete-btn"
                                                    onClick={() => deleteTask(task.id)}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary">
                            프로젝트 생성 및 초대 발송
                        </button>
                    </form>
                </div>
                <a href="/main" className="back-link">
                    메인 페이지로 이동
                </a>
            </div>
        </>
    );
};

export default Write;