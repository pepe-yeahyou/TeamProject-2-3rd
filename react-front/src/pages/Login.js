import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import useAuth from '../hooks/useAuth';
import '../styles/Auth.css';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    
    const { login: authLogin } = useAuth(); 
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); // 오류 메시지 초기화

        try {
            // 4. 백엔드 로그인 API 호출 (POST /api/auth/login)
            const response = await api.post('/auth/login', {
                username: username,
                password: password,
            });

            // 5. 응답에서 토큰과 사용자명 추출
            const { token, displayName } = response.data;

            // 6. 인증 상태 업데이트 및 토큰 저장 (useAuth 훅에서 처리)
            authLogin(token, displayName); 

            // 7. 대시보드로 이동
            navigate('/dashboard');

        } catch (err) {
            // 8. 로그인 실패 처리
            const errorMessage = err.response?.data?.displayName || "아이디 또는 비밀번호를 다시 확인해 주세요.";
            setError(errorMessage);
            console.error('로그인 오류:', err);
        }
    };

    return (
        <div className="auth-container">
            <form onSubmit={handleSubmit} className="login-box">
                <h2 className="title">로그인</h2>
                {/* 오류 메시지 영역 */}
                {error && <p className="error-message">{error}</p>}
                
                <div className="input-group">
                    <input
                        type="text"
                        placeholder="아이디"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="input-field"
                    />
                </div>
                <div className="input-group">
                    <input
                        type="password"
                        placeholder="비밀번호"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="input-field"
                    />
                </div>
                
                <button type="submit" className="primary-button">
                    로그인
                </button>

                <p className="link-group">
                    계정이 없으신가요? <a href="/register">회원가입</a>
                </p>
                {/* 비밀번호 찾기 링크도 추가 가능: <a href="/find-password">비밀번호 찾기</a> */}
            </form>
        </div>
    );
}

export default Login;