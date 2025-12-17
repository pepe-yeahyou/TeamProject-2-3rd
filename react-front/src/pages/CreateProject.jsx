import React, { useState, useEffect } from 'react';
import '../styles/create-project.css';

const CreateProject = () => {
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

    const [selectedMembers, setSelectedMembers] = useState(new Map([
        [0, {
            userId: 0,                    // ← userId로 통일
            displayName: '나 (팀장)',      // ← displayName으로
            email: '현재사용자',
            isLeader: true
        }]
    ]));

    const [tasks, setTasks] = useState([
        { id: 1, taskName: '프로젝트 기획 회의', assigneeId: 0 },
        { id: 2, taskName: '요구사항 분석', assigneeId: 0 }
    ]);

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [nextTaskId, setNextTaskId] = useState(3);
    const [isSearching, setIsSearching] = useState(false);

    // 선택된 멤버 수 계산
    const selectedMemberCount = Array.from(selectedMembers.keys()).filter(id => id !== 0).length;

    // 더미 사용자 데이터
    const dummyUsers = [
        { userId: 1, username: 'kim', displayName: '김철수', email: 'kim@email.com' },
        { userId: 2, username: 'lee', displayName: '이영희', email: 'lee@email.com' },
        { userId: 3, username: 'park', displayName: '박지훈', email: 'park@email.com' },
        { userId: 4, username: 'choi', displayName: '최수진', email: 'choi@email.com' },
        { userId: 5, username: 'jung', displayName: '정민우', email: 'jung@email.com' }
    ];

    // 사용자 검색 함수
    const handleSearch = () => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        
        // 시뮬레이션: API 호출 딜레이
        setTimeout(() => {
            const results = dummyUsers.filter(user =>
                user.displayName.includes(searchQuery) || user.email.includes(searchQuery)
            );
            setSearchResults(results);
            setIsSearching(false);
        }, 500);
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
        const newSelectedMembers = new Map(selectedMembers);
        
        if (newSelectedMembers.has(user.userId)) {
            newSelectedMembers.delete(user.userId);
        } else {
            newSelectedMembers.set(user.userId, user);
        }
        
        setSelectedMembers(newSelectedMembers);
    };

    // 팀원 제거
    const removeMember = (userId) => {
        const newSelectedMembers = new Map(selectedMembers);
        newSelectedMembers.delete(userId);
        setSelectedMembers(newSelectedMembers);
    };

    // 업무 추가
    const addTask = () => {
        const newTask = {
            id: nextTaskId,
            taskName: '',
            assigneeId: 0
        };
        
        setTasks([...tasks, newTask]);
        setNextTaskId(nextTaskId + 1);
    };

    // 업무 제목 변경
    const updateTaskName = (taskId, newTaskName) => {
        setTasks(tasks.map(task => 
            task.id === taskId ? { ...task, taskName: newTaskName } : task
        ));
    };

    // 업무 담당자 변경
    const updateTaskAssignee = (taskId, assigneeId) => {
            setTasks(tasks.map(task =>
            task.id === taskId ? { ...task, assigneeId } : task
        ));
    };

    // 업무 삭제
    const deleteTask = (taskId) => {
        setTasks(tasks.filter(task => task.id !== taskId));
    };

    // 폼 제출 처리
    const handleSubmit = async (e) => {
        e.preventDefault();

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
            .filter(id => id !== 0);

        const initialTasks = tasks
            .filter(task => task.taskName.trim())
            .map(task => ({
                taskName: task.taskName.trim(),
                assignedUserId: task.assigneeId === 0 ? null : task.assigneeId
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
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(projectDataToSend)
            });

            if (response.ok) {
                const result = await response.json();
                window.location.href = `/summary`;  // 메인화면(요약 페이지)으로 이동
                // 또는 프로젝트 상세 페이지로 가고 싶으면: `/projects/${result.projectId}`
            } else {
                alert('서버 오류가 발생했습니다.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('서버 연결에 실패했습니다.');
        }
    };

    // 담당자 옵션 생성
    const getAssigneeOptions = () => {
        const options = [{ value: 0, label: '나 (팀장)' }];
        
        selectedMembers.forEach((member, id) => {
        if (id !== 0) {
            options.push({
                value: id,
                label: `${member.displayName} (${member.email})`
                });
            }
        });
        
        return options;
    };

    // 선택된 팀원 목록 HTML 생성
    const renderSelectedMembers = () => {
        const members = [];
        
        selectedMembers.forEach((member, id) => {
        if (id === 0) {
            members.push(<div key="me">나 (프로젝트 생성자, 팀장)</div>);
        } else {
            members.push(
            <div key={id}>
                • {member.displayName} rmflr({member.email})
            </div>
            );
        }
        });
        
        return members;
    };

    return (
        <div className="container">
        <div className="header">
            <h1 className="title">새 프로젝트 생성</h1>
            <p className="subtitle">회원 검색으로 팀원을 초대하고 업무를 배정하세요</p>
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
                    placeholder="이름 또는 이메일로 검색"
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
                        return (
                        <div 
                            key={user.userId}
                            className={`team-member ${isSelected ? 'selected' : ''}`}
                            onClick={() => toggleMemberSelection(user)}
                        >
                            <div className="member-info">
                            <div className="member-avatar">
                                {user.displayName.substring(0, 2)}
                            </div>
                            <div className="member-details">
                                <div className="member-name">{user.displayName}</div>
                                <div className="member-email">{user.email}</div>
                            </div>
                            </div>
                            {isSelected && (
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

            <a href="/" className="btn btn-secondary">
                돌아가기
            </a>
            </form>
        </div>

        <a href="/" className="back-link">
            메인 페이지로 이동
        </a>
        </div>
    );
};

export default CreateProject;