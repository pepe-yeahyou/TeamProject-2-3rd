import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import SummaryCards from '../components/SummaryCards';
import ProjectList from '../components/ProjectList';
import Header from '../components/Header';
import '../styles/Dashboard.css';

function DashboardPage() {
    const [userName, setUserName] = useState("사용자");
    const [summary, setSummary] = useState(null);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. 요약 정보 (DashboardSummaryVO) 로딩
                const summaryRes = await api.get('/dashboard/summary');
                setSummary(summaryRes.data);

                // 2. 프로젝트 목록 (List<ProjectSummaryVO>) 로딩
                const projectsRes = await api.get('/dashboard/projects');
                setProjects(projectsRes.data);

                // 3. 사용자 이름 로딩
                const nameRes = await api.get('/dashboard/username');
                setUserName(nameRes.data || "사용자");

            } catch (err) {
                setError("데이터를 로드하는 중 오류가 발생했습니다.");
                console.error(err);
                // 401 에러 시 로그아웃 처리 유도
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div>로딩 중...</div>;
    if (error) return <div>오류: {error}</div>;

    const displayName = summary?.userDisplayName || "사용자";

    return (
        <div className="dashboard-layout">
            <Header userName={userName} /> 
            <SummaryCards summary={summary} /> 
            <ProjectList projects={projects} /> 
        </div>
    );
}

export default DashboardPage;