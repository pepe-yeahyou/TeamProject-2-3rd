import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardData } from '../hooks/useDashboardData';
import SummaryCards from '../components/SummaryCards';
import ProjectList from '../components/ProjectList';
import Header from '../components/Header';
import '../styles/Dashboard.css';

function DashboardPage() {
    const navigate = useNavigate();
    const { summary, projects, userName, loading, error } = useDashboardData();
    
    // 새 프로젝트 버튼 핸들러
    const handleNewProjectClick = () => {
        // navigate(`/api/projects/${userId}`);
    };

    if (loading) return <div>로딩 중...</div>; // (선택: 스켈레톤 UI로 대체 가능)
    if (error) return <div>오류: {error}</div>;

    return (
        <div className="dashboard-layout">
            <Header 
                userName={userName} 
                onNewProjectClick={handleNewProjectClick}
            /> 
            <SummaryCards summary={summary} /> 
            <ProjectList projects={projects} /> 
        </div>
    );
}

export default DashboardPage;