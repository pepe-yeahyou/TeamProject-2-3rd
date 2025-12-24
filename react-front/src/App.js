import './styles/GlobalStyles.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Register from './pages/Register';
import useAuth from './hooks/useAuth';
import React , { useEffect } from 'react';
import Detail from './component/Detail';
import Write from "./component/Write";

function App() {
  const { isAuthenticated } = useAuth(); // 인증 여부 확인

  const handleAutoLogout = () => {
    alert("로그인 세션이 만료되었습니다. 다시 로그인 화면으로 돌아갑니다.");
    localStorage.clear();
    window.location.href = '/login';
  };

  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    
    if (token) {
      try {
        // 1. JWT 토큰의 Payload 부분을 추출 (Base64 디코딩)
        const base64Payload = token.split('.')[1];
        const payload = JSON.parse(atob(base64Payload));
        
        // 2. 만료 시간 계산 (exp는 초 단위이므로 1000을 곱함)
        const expirationTime = payload.exp * 1000;
        const currentTime = Date.now();
        const timeLeft = expirationTime - currentTime;

        if (timeLeft <= 0) {
          // 이미 만료된 경우 즉시 처리
          handleAutoLogout();
        } else {
          // 3. 남은 시간 뒤에 알림창을 띄우고 로그아웃
          const timer = setTimeout(() => {
            handleAutoLogout();
          }, timeLeft);

          return () => clearTimeout(timer); // 앱 종료 시 타이머 정리
        }
      } catch (e) {
        console.error("Token parsing error", e);
      }
    }
  }, [isAuthenticated]); // 인증 상태가 변할 때마다(로그인 성공 시) 다시 설정

  return (
    <Router>
      <Routes>
        {/* 인증/가입 관련 */}
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* 대시보드 (인증 필수) */}
        <Route 
          path="/dashboard" 
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} 
        />

        <Route 
          path="/write"
          element={isAuthenticated ? <Write /> : <Navigate to="/login" />}
        />

        <Route 
          path="/detail/:projectId"
          element={isAuthenticated ? <Detail /> : <Navigate to="/login" />}
        />

        {/* 기본 경로 설정 */}
        <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
      </Routes>
    </Router>
  );
}

export default App;