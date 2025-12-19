import React from 'react';

function SummaryCards({ summary }) {
    if (!summary) return <div className="loading-message">로딩 중...</div>;

    const cardData = [
        { title: "전체 프로젝트", count: summary.totalProjects || 0 },
        { title: "진행 중", count: summary.inProgressCount || 0 },
        { title: "완료됨", count: summary.completedCount || 0 },
    ];

    return (
        <div className="summary-cards-container">
            {cardData.map((card, index) => (
                <div key={index} className="summary-card">
                    <h3 className="card-title">{card.title}</h3>
                    <p className="card-count">{card.count}</p>
                </div>
            ))}
        </div>
    );
}

export default SummaryCards;