import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Header({ userName, onNewProjectClick }) { 
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="main-header">
            <h1 className="logo">프로젝트 대시보드</h1>
            <div className="header-info">
                <span className="user-greeting">안녕하세요, {userName}님</span>
                <div className="header-button-group">
                    <button className="new-project-button" onClick={onNewProjectClick}>
                        + 새 프로젝트
                    </button>
                    <button className="logout-button" onClick={handleLogout}>
                        로그아웃
                    </button>
                </div>
            </div>
        </header>
    );
}

export default Header;