import './styles/GlobalStyles.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Register from './pages/Register';
import useAuth from './hooks/useAuth';


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

        {/* 1. 프로젝트 생성(글쓰기) 페이지 연결 */}
        {/* <Route path="/api/projects/:userId" element={<ProjectCreate />} /> */}

        {/* 2. 프로젝트 상세 페이지 연결 */}
        {/* <Route path="/detail/:projectId" element={<ProjectDetail />} /> */}

        {/* 기본 경로 설정 */}
        <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
      </Routes>
    </Router>
  );
}

export default App;