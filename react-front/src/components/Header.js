import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth'

function Header( {userName} ) {
    //1.useAuth훅에서 필요한 값 가져오기
    const { displayName, logout } = useAuth();
    const navigate = useNavigate();

    //2. 로그아웃 핸들러
    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="main-header">
            <div className="user-greeting">
                안녕하세요, {userName}님!
            </div>
            <div className="header-actions">
                <button className="new-project-button">
                    + 새 프로젝트
                </button>
                <button onClick={handleLogout} className="logout-button">
                    로그아웃
                </button>
            </div>
        </header>
    );
}

export default Header;