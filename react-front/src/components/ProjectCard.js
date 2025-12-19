import React from 'react';
import { useNavigate } from 'react-router-dom';

function ProjectCard({ project }) {
    const navigate = useNavigate();
    const {
        projectId, title, description, progressRate,
        status, managerName, coWorkerNames, startDate, endDate
    } = project;

    const handleCardClick = () => navigate(`/detail/${projectId}`);

    return (
        <div className="project-card" onClick={handleCardClick} style={{cursor: 'pointer'}}>
            <div className="card-header">
                <h3 className="card-title">{title}</h3>
                {/* 인라인 배경색 지우고 클래스만 남김 -> CSS에서 주황색 처리 */}
                <span className="status-badge">{status}</span>
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
                <div className="avatar-group">
                    {coWorkerNames && coWorkerNames.length > 0 ? (
                        coWorkerNames.slice(0, 3).map((name, index) => (
                            <span key={index} className="avatar-item" title={name}>
                                {name.charAt(0)}
                            </span>
                        ))
                    ) : (
                        <span className="info-value" style={{fontSize: '0.8em', color: '#64748b'}}>없음</span>
                    )}
                    {coWorkerNames && coWorkerNames.length > 3 && (
                        <span className="more-avatar-count">+{coWorkerNames.length - 3}</span>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ProjectCard;