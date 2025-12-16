import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState(null);
    
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError(null);

        try {
            const response = await api.post('/auth/login', { username, password });
            const { token, displayName } = response.data; // AuthController에서 응답받은 데이터
            
            // 전역 상태 업데이트 및 로컬 스토리지에 저장
            login(token, displayName); 

            // 로그인 성공 후 대시보드 페이지로 이동
            navigate('/dashboard'); 

        } catch (err) {
            const errorMessage = err.response?.data?.message || "로그인 중 알 수 없는 오류가 발생했습니다.";
            setLoginError(errorMessage);
            console.error('Login Failed:', err);
        }
    };

    return (
        <div className="login-container">
            <form onSubmit={handleLogin} className="login-form">
                <h2>로그인</h2>
                {loginError && <p className="error-message">{loginError}</p>}
                
                <input
                    type="text"
                    placeholder="아이디"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="비밀번호"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit">로그인</button>
            </form>
        </div>
    );
}

export default LoginPage;