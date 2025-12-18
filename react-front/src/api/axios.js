import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8484', // Spring Boot 백엔드 주소로 변경
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: 모든 요청 전에 로컬 스토리지에서 토큰을 가져와 헤더에 추가
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('jwt_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // 서버 응답이 있고, 상태 코드가 401(Unauthorized)이면
        if (error.response && error.response.status === 401) {
            console.log('401 Unauthorized: 세션이 만료되었거나 권한이 없습니다. 자동 로그아웃 처리.');
            
            // 1. 로컬 스토리지 데이터 삭제 (강제 로그아웃)
            localStorage.removeItem('jwt_token');
            localStorage.removeItem('display_name');
            
            // 2. 로그인 페이지로 강제 리다이렉트
            // window.location.href를 사용하면 React 라우터와 무관하게 페이지를 이동시킵니다.
            window.location.href = '/login'; 
        }
        return Promise.reject(error);
    }
);

export default api;