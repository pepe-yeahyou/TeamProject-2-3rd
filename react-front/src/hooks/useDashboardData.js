import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export const useDashboardData = () => {
    const { userName: authUserName, isAuthenticated, login } = useAuth(); // AuthContext에서 정보 가져오기
    
    const [summary, setSummary] = useState(null);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userName, setUserName] = useState(authUserName); // Dashboard에서 쓸 이름

    useEffect(() => {
        if (!isAuthenticated) {
            setLoading(false);
            return; // 인증되지 않았다면 API 호출을 시도하지 않음
        }

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                // Promise.all로 모든 API 호출 병렬 처리
                const [summaryRes, projectsRes, nameRes] = await Promise.all([
                    api.get('/dashboard/summary'),
                    api.get('/dashboard/projects'),
                    api.get('/dashboard/username')
                ]);

                setSummary(summaryRes.data);
                setProjects(projectsRes.data);
                
                // AuthContext에 저장된 이름이 없을 경우만 API 결과로 업데이트
                if (!authUserName) {
                    setUserName(nameRes.data || "손님");
                }
                
            } catch (err) {
                // 인터셉터가 401/403은 처리하므로, 여기서는 그 외 오류만 처리
                setError(err.message || "데이터 로딩 중 알 수 없는 오류 발생");
                console.error("데이터 패칭 오류:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isAuthenticated, authUserName]); // 인증 상태가 바뀌면 다시 로드

    return { summary, projects, userName: userName || "손님", loading, error };
};