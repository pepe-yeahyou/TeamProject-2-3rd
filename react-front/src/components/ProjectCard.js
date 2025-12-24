import React from 'react';
import { useNavigate } from 'react-router-dom';

function ProjectCard({ project }) {
    const navigate = useNavigate();
    const {
        projectId, title, description, progressRate,
        status, managerName, coWorkerNames, startDate, endDate
    } = project;

    const handleCardClick = () => navigate(`/detail/${projectId}`);

    const isExpired = endDate && new Date(endDate) < new Date().setHours(0, 0, 0, 0);

    const displayStatus = (status !== '완료' && isExpired) ? '기간만료' : status;

    return (
        <div className="project-card" onClick={handleCardClick} style={{cursor: 'pointer'}}>
            <div className="card-header">
                <h3 className="card-title">{title}</h3>
                <span className={`status-badge status-${displayStatus}`}>
                    {displayStatus}
                </span>
            </div>

            <p className="description-text">{description}</p>
            
            <div className="info-row">
                <span className="info-label">기간</span>
                <span className="info-value">{startDate} ~ {endDate}</span>
            </div>

            <div className="info-row">
                <span className="info-label">담당자</span>
                <span className="info-value">{managerName}</span>
            </div>

            <div className="progress-container">
                <p className="progress-text">진척도 {progressRate}%</p>
                <div className="progress-bar-background">
                    {/* 인라인 스타일에서 배경색 빼고 width만 동적으로 줌 */}
                    <div className="progress-bar-fill" style={{ width: `${progressRate}%` }}></div>
                </div>
            </div>

            <div className="co-workers-group">
                <span className="info-label">협업자</span>
                <div className="co-worker-info-area">
                    {coWorkerNames && coWorkerNames.length > 0 ? (
                        <span className="co-worker-text">
                            {coWorkerNames[0]} 
                            {coWorkerNames.length > 1 && ` 외 ${coWorkerNames.length - 1}명`}
                        </span>
                    ) : (
                        <span className="no-co-workers">없음</span>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ProjectCard;