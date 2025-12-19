import './styles/GlobalStyles.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Register from './pages/Register';
import useAuth from './hooks/useAuth';
import React from 'react';
import Detail from './component/Detail'; // 상세 페이지 컴포넌트
import Write from "./pages/Write";      // 생성 페이지 컴포넌트

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Router>
      <Routes>
        {/* 인증/가입 관련 */}
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* 대시보드 (로그인한 사람만) */}
        <Route 
          path="/dashboard" 
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} 
        />

        {/* 1. 프로젝트 생성 페이지: /write 로 접속 시 Write 컴포넌트 실행 */}
        <Route 
          path="/write" 
          element={isAuthenticated ? <Write /> : <Navigate to="/login" />} 
        />

        {/* 2. 프로젝트 상세 페이지: /detail/123 형식으로 접속 시 Detail 컴포넌트 실행 */}
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