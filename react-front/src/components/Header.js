import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Header({ userName, onNewProjectClick }) { 
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout(); // 1. Context 상태 변경 및 로컬 스토리지 삭제
        navigate('/login'); // 2. 로그인 페이지로 리디렉션
    };

    return (
        <header className="dashboard-header">
            <h1 className="logo">프로젝트 대시보드</h1>
            <div className="header-info">
                <span className="welcome-message">안녕하세요, {userName}님</span>
                
                <button 
                    className="btn btn-primary" 
                    onClick={onNewProjectClick} // Prop으로 전달받은 핸들러 사용
                >
                    + 새 프로젝트
                </button>
                
                <button 
                    className="btn btn-secondary" 
                    onClick={handleLogout} // Context를 이용한 로그아웃
                >
                    로그아웃
                </button>
            </div>
        </header>
    );
}

export default Header;