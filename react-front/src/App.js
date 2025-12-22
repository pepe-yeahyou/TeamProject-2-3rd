import './styles/GlobalStyles.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Register from './pages/Register';
import useAuth from './hooks/useAuth';
import React from 'react';
import Detail from './component/Detail';
import Write from "./component/Write";

function App() {
  const { isAuthenticated } = useAuth(); // 인증 여부 확인

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