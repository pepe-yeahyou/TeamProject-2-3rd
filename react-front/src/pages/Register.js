import '../styles/Auth.css';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';


function Register() {
    // 폼 입력 상태 관리
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
    
        // 1. 비밀번호 일치 확인
        if (password !== confirmPassword) {
            setError('비밀번호가 일치하지 않습니다.');
            return;
        }

        try {
            //2. 백엔트 회원가입 API 호출
            await api.post('/register', {
                username: username,
                password: password,
                displayName: displayName
            });

            // 3. 성공 처리
            setSuccess('회원가입이 완료되었습니다!');

            // 2초 후 로그인 페이지로 리디렉션
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            //4. 회원가입 실패 처리
            const errorMessage = err.response?.data?.message || "입력 정보를 확인해주세요.";
            setError(errorMessage);
            console.error('회원가입 오류:', err);
        }
    };
    
    return (
        <div className="auth-container">
            <form onSubmit={handleSubmit} className="login-box">
                <h2 className="title">회원가입</h2>
                
                {/* 입력창들을 별도 div로 감싸서 간격 제어를 확실히 함 */}
                <div className="auth-form-fields">
                    <div className="input-group">
                        <input type="text" placeholder="사용자 이름" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required className="input-field" />
                    </div>
                    <div className="input-group">
                        <input type="text" placeholder="아이디" value={username} onChange={(e) => setUsername(e.target.value)} required className="input-field" />
                    </div>
                    <div className="input-group">
                        <input type="password" placeholder="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} required className="input-field" />
                    </div>
                    <div className="input-group">
                        <input type="password" placeholder="비밀번호 확인" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="input-field" />
                    </div>
                </div>

                {/* 메시지는 버튼 바로 위에 배치 (공간 차지 방지) */}
                {error && <p className="error-message">{error}</p>}
                {success && <p className="success-message">{success}</p>}

                <button type="submit" className="primary-button">가입하기</button>
                
                <p className="link-group">
                    <span>이미 계정이 있으신가요?</span> <a href="/login">로그인</a>
                </p>
            </form>
        </div>
    );
}

export default Register;