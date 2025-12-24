import axios from 'axios';

export const baseURL = 'http://localhost:8484';
export const mainURL = '${baseURL}/dashboard'
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

api.interceptors.response.use(
    (response) => response,
    (error) => {

        const isLoginRequest = error.config.url.includes('/login');

        //에러 상태 코드가 401인 경우 처리
        if (error.response && error.response.status === 401) {
            if (isLoginRequest) {
                // 로그인 페이지에서 비번 틀린 경우는 인터셉터가 가로채지 않고 
                // LoginPage.js의 catch문으로 에러를 그대로 던집니다.
                return Promise.reject(error);
            }

            // 로그인이 아닌 다른 API 호출 중 401이 발생한 경우에만 세션 만료 처리
            alert("로그인 세션이 만료되었습니다. 다시 로그인해주세요.");
            localStorage.removeItem('jwt_token');
            localStorage.removeItem('display_name');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;