import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8484', // Spring Boot 백엔드 주소로 변경
    headers: {
        'Content-Type': 'application/json',
    },
});

// 요청 인터셉터: 모든 요청에 토큰을 자동으로 삽입
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('jwt_token'); // AuthContext에서 저장한 키값
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        //에러 상태 코드가 401인 경우 처리
        if (error.response && error.response.status === 401) {
            alert("로그인 세션이 만료되었습니다. 다시 로그인해주세요.");

            //토큰 삭제 및 페이지 이동
            localStorage.removeItem('jwt_token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;