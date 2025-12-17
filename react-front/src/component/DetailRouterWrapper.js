import React from 'react';
import { useParams } from 'react-router-dom';
import Detail from './Detail'; // 동일 폴더 내 Detail.js import

function DetailRouterWrapper() {
    
    // 1. URL 파라미터에서 projectId 추출
    const { projectId } = useParams();
    const numericProjectId = parseInt(projectId);
    
    // 2. 현재 로그인 사용자 정보 (Detail 및 Chat 컴포넌트 작동에 필수)
    // 🚨 실제 프로젝트에서는 Context/Redux에서 가져와야 하지만, 여기서는 Mock Data를 사용합니다.
    const currentUser = { 
        userId: 101, 
        userName: '임시 사용자', 
        token: 'mock_session_token' 
    }; 

    if (isNaN(numericProjectId)) {
        return <div>잘못된 프로젝트 ID입니다.</div>;
    }

    // 최종적으로 Detail 컴포넌트를 렌더링
    return (
        <Detail 
            projectId={numericProjectId} 
            currentUser={currentUser} 
        />
    );
}

export default DetailRouterWrapper;