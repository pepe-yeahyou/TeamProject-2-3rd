import React from 'react';

function SummaryCards({ summary }) {
    // summary 데이터가 null이거나 로딩 중일 때 처리
    if (!summary) {
        return <div className="loading-message">데이터를 불러오는 중...</div>;
    }

    // 대시보드 요약 카드로 표시할 항목 정의
    const cardData = [
        {
            title: "전체 프로젝트",
            count: summary.totalProjects,
            color: "#007bff", 
        },
        {
            title: "진행 중",
            count: summary.inProgressCount,
            color: "#ffc107", 
        },
        {
            title: "완료됨",
            count: summary.completedCount,
            color: "#28a745",
        },
    ];

    return (
        <div className="summary-cards-container">
            {cardData.map((card, index) => (
                <div 
                    key={index} 
                    className="summary-card"
                    style={{ borderLeft: `5px solid ${card.colorVar}` }}
                >
                    <h3 className="card-title">{card.title}</h3>
                    <p className="card-count">{card.count}</p>
                </div>
            ))}
        </div>
    );
}

export default SummaryCards;