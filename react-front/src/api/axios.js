import axios from 'axios';

export const baseURL = 'http://172.30.1.6:8484';
export const chatURL = `${baseURL}/api/chat`;
export const detailURL = `${baseURL}/detail`;

const api = axios.create({
    //baseURL: 'http://localhost:8484', // Spring Boot 백엔드 주소로 변경
    baseURL: baseURL, // Spring Boot 백엔드 주소로 변경
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

export default api;