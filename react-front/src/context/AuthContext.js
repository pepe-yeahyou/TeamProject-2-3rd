import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    // 1. 초기 상태: 로컬 스토리지에서 토큰 존재 여부로 인증 상태를 결정
    const [isAuthenticated, setIsAuthenticated] = useState(
        !!localStorage.getItem('jwt_token')
    );
    const [displayName, setDisplayName] = useState(
        localStorage.getItem('display_name') || null
    );

    // 2. 로그인 함수: 토큰과 사용자명을 저장하고 상태 업데이트
    const login = (token, name) => {
        localStorage.setItem('jwt_token', token);
        localStorage.setItem('display_name', name);
        setIsAuthenticated(true);
        setDisplayName(name);
    };

    // 3. 로그아웃 함수: 토큰과 사용자명 제거하고 상태 업데이트
    const logout = () => {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('display_name');
        setIsAuthenticated(false);
        setDisplayName(null);
    };

    const value = {
        isAuthenticated,
        displayName,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 4. 커스텀 훅: 컴포넌트에서 쉽게 Context에 접근하도록 함
export const useAuth = () => {
    return useContext(AuthContext);
};