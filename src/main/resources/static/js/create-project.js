// 오늘 날짜 설정
const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 7);

const formatDate = (date) => {
    return date.toISOString().split('T')[0];
};

// 선택된 팀원 관리
const selectedMembers = new Map(); // userId -> memberInfo
selectedMembers.set('me', {
    id: 'me',
    name: '나 (팀장)',
    email: '현재사용자',
    isManager: true
});

// DOM이 로드된 후 초기화
document.addEventListener('DOMContentLoaded', () => {
    initDateInputs();
    initEventListeners();
    updateAssigneeOptions();
    updateSelectedMembersList();
});

function initDateInputs() {
    document.getElementById('startDate').value = formatDate(today);
    document.getElementById('endDate').value = formatDate(tomorrow);
}

function initEventListeners() {
    // 검색 버튼
    document.getElementById('searchBtn').addEventListener('click', handleSearch);

    // 엔터키로 검색
    document.getElementById('searchQuery').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearch();
        }
    });

    // 업무 추가 버튼
    document.getElementById('addTaskBtn').addEventListener('click', addTask);

    // 폼 제출
    document.getElementById('projectForm').addEventListener('submit', handleFormSubmit);

    // 기존 업무 삭제 버튼들
    document.querySelectorAll('.task-row .delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.task-row').remove();
        });
    });
}

// 담당자 선택 옵션 업데이트 함수
function updateAssigneeOptions() {
    const assigneeSelects = document.querySelectorAll('.assignee-select');
    assigneeSelects.forEach(select => {
        const currentValue = select.value;
        select.innerHTML = '';

        // 기본 옵션: 나 (팀장)
        const meOption = document.createElement('option');
        meOption.value = 'me';
        meOption.textContent = '나 (팀장)';
        select.appendChild(meOption);

        // 선택된 팀원들 옵션 추가 (나 제외)
        selectedMembers.forEach((member, userId) => {
            if (userId !== 'me') {
                const option = document.createElement('option');
                option.value = userId;
                option.textContent = `${member.name} (${member.email})`;
                select.appendChild(option);
            }
        });

        // 기존 선택값 복원
        select.value = currentValue;
        if (!select.value && select.options.length > 0) {
            select.value = 'me';
        }
    });
}

// 선택된 팀원 목록 업데이트
function updateSelectedMembersList() {
    const selectedList = document.getElementById('selectedMembersList');
    const countElement = document.getElementById('selectedCount');

    let html = '나 (프로젝트 생성자, 팀장)';
    let selectedCount = 0;

    selectedMembers.forEach((member, userId) => {
        if (userId !== 'me') {
            html += `<div>• ${member.name} (${member.email})</div>`;
            selectedCount++;
        }
    });

    selectedList.innerHTML = html;
    countElement.textContent = `선택됨: ${selectedCount}명`;
}

// 회원 검색 처리
async function handleSearch() {
    const query = document.getElementById('searchQuery').value.trim();
    const teamList = document.getElementById('teamList');

    if (!query) {
        teamList.innerHTML = '<div class="no-results">검색어를 입력해주세요.</div>';
        return;
    }

    teamList.innerHTML = '<div class="loading-message">검색 중...</div>';

    try {
        const users = await searchUsers(query);
        displaySearchResults(users);
    } catch (error) {
        console.error('Search error:', error);
        teamList.innerHTML = '<div class="error-message">검색 중 오류가 발생했습니다.</div>';
    }
}

// 사용자 검색 (백엔드 API 호출)
async function searchUsers(query) {
    // 실제로는 백엔드 API 호출
    // const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
    // return await response.json();

    // 임시 더미 데이터
    const dummyUsers = [
        { id: 'user1', name: '김철수', email: 'kim@email.com' },
        { id: 'user2', name: '이영희', email: 'lee@email.com' },
        { id: 'user3', name: '박지훈', email: 'park@email.com' },
        { id: 'user4', name: '최수진', email: 'choi@email.com' },
        { id: 'user5', name: '정민우', email: 'jung@email.com' }
    ].filter(user =>
        user.name.includes(query) || user.email.includes(query)
    );

    return dummyUsers;
}

// 검색 결과 표시
function displaySearchResults(users) {
    const teamList = document.getElementById('teamList');

    if (users.length === 0) {
        teamList.innerHTML = '<div class="no-results">검색 결과가 없습니다.</div>';
        return;
    }

    teamList.innerHTML = '';
    users.forEach(user => createTeamMemberElement(user));
}

// 팀원 요소 생성
function createTeamMemberElement(user) {
    const teamList = document.getElementById('teamList');
    const isSelected = selectedMembers.has(user.id);

    const memberDiv = document.createElement('div');
    memberDiv.className = `team-member ${isSelected ? 'selected' : ''}`;
    memberDiv.innerHTML = `
        <div class="member-info">
            <div class="member-avatar">${user.name.substring(0, 2)}</div>
            <div class="member-details">
                <div class="member-name">${user.name}</div>
                <div class="member-email">${user.email}</div>
            </div>
        </div>
        <button type="button" class="delete-btn" style="display: ${isSelected ? 'block' : 'none'};">✕</button>
    `;

    memberDiv.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') return;
        toggleTeamMemberSelection(user, memberDiv);
    });

    const deleteBtn = memberDiv.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeTeamMember(user.id, memberDiv);
    });

    teamList.appendChild(memberDiv);
}

// 팀원 선택 토글
function toggleTeamMemberSelection(user, element) {
    if (selectedMembers.has(user.id)) {
        selectedMembers.delete(user.id);
        element.classList.remove('selected');
        element.querySelector('.delete-btn').style.display = 'none';
    } else {
        selectedMembers.set(user.id, user);
        element.classList.add('selected');
        element.querySelector('.delete-btn').style.display = 'block';
    }

    updateAssigneeOptions();
    updateSelectedMembersList();
}

// 팀원 제거
function removeTeamMember(userId, element) {
    selectedMembers.delete(userId);
    element.classList.remove('selected');
    element.querySelector('.delete-btn').style.display = 'none';
    updateAssigneeOptions();
    updateSelectedMembersList();
}

// 업무 추가
function addTask() {
    const taskList = document.getElementById('taskList');
    const taskRow = document.createElement('div');
    taskRow.className = 'task-row';

    taskRow.innerHTML = `
        <input type="text" class="task-input" placeholder="업무 제목">
        <select class="assignee-select"></select>
        <button type="button" class="delete-btn">✕</button>
    `;

    taskList.appendChild(taskRow);
    updateAssigneeOptions();

    taskRow.querySelector('.delete-btn').addEventListener('click', function() {
        taskRow.remove();
    });
}

// 폼 제출 처리
async function handleFormSubmit(e) {
    e.preventDefault();

    if (!validateForm()) {
        return;
    }

    const projectData = collectFormData();

    try {
        await submitProject(projectData);
    } catch (error) {
        console.error('Submission error:', error);
        alert('서버 연결에 실패했습니다.');
    }
}

// 폼 유효성 검사
function validateForm() {
    const projectName = document.getElementById('projectName').value.trim();
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    if (!projectName) {
        alert('프로젝트 이름을 입력해주세요.');
        return false;
    }

    if (new Date(startDate) > new Date(endDate)) {
        alert('시작일은 마감일보다 빨라야 합니다.');
        return false;
    }

    return true;
}

// 폼 데이터 수집
function collectFormData() {
    const projectName = document.getElementById('projectName').value;
    const projectDescription = document.getElementById('projectDescription').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    // 선택된 팀원 목록 수집 (나 제외)
    const invitedUserIds = [];
    selectedMembers.forEach((member, userId) => {
        if (userId !== 'me') {
            invitedUserIds.push(userId);
        }
    });

    // 업무 목록 수집
    const tasks = [];
    document.querySelectorAll('.task-row').forEach(row => {
        const titleInput = row.querySelector('.task-input');
        const assigneeSelect = row.querySelector('.assignee-select');

        if (titleInput.value.trim()) {
            const assigneeId = assigneeSelect.value;
            const assigneeName = assigneeSelect.options[assigneeSelect.selectedIndex].text;

            tasks.push({
                title: titleInput.value.trim(),
                assigneeId: assigneeId === 'me' ? null : assigneeId,
                assigneeName: assigneeName
            });
        }
    });

    return {
        name: projectName,
        description: projectDescription,
        startDate: startDate,
        endDate: endDate,
        invitedUserIds: invitedUserIds,
        initialTasks: tasks
    };
}

// 프로젝트 제출
async function submitProject(projectData) {
    const submitBtn = document.querySelector('#projectForm button[type="submit"]');
    const originalText = submitBtn.textContent;

    submitBtn.textContent = '생성 중...';
    submitBtn.disabled = true;

    try {
        const response = await fetch('/api/projects', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(projectData)
        });

        if (response.ok) {
            const result = await response.json();
            const invitedCount = projectData.invitedUserIds.length;
            alert(`프로젝트가 생성되었습니다!\n\n${invitedCount}명의 팀원에게 초대가 발송됩니다.`);
            window.location.href = `/projects/${result.id}`;
        } else {
            const error = await response.text();
            alert(`프로젝트 생성 실패: ${error}`);
        }
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}