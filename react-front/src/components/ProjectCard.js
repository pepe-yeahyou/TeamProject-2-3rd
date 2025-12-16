import React from 'react';
import { useNavigate } from 'react-router-dom';

function ProjectCard({ project }) {

    const navigate = useNavigate();

    const {
        projectId,
        title,
        description,
        progressRate,
        status,
        managerName,
        coWorkerNames,
        startDate,
        endDate
    } = project;

    // 카드를 클릭했을 때 상세 페이지로 이동
    const handleCardClick = () => {
        navigate(`/project/${projectId}`)
    }

    // GlobalStyles의 변수 사용
    const progressColor = status === '완료' ? 'var(--color-status-completed)' : 'var(--color-accent-blue)';
    
    // statusColor 변수 정의
    const statusColor = status === '완료' ? 'var(--color-status-completed)' : 'var(--color-status-in-progress)';

    // 진척도 바
    const progressBarStyles = {
        width: `${progressRate}%`,
        height: '10px',
        backgroundColor: status === '완료' ? '#28a745' : '#007bff', 
        borderRadius: '5px',  
    };

    return (
        <div className="project-card" onClick={handleCardClick} style={{cursor: 'pointer'}}>
            <div className="card-header">
                <h3 className="card-title">{title}</h3>
                <span className="status-badge" style={{ backgroundColor: statusColor }}>
                    {status}
                </span>
            </div>

            <p className="description-text">{description}</p>
            
            <div className="info-row">
                <span className="info-label">기간:</span>
                <span className="info-value">{startDate} ~ {endDate}</span>
            </div>

            <div className="info-row">
                <span className="info-label">담당자:</span>
                <span className="info-value manager">{managerName}</span>
            </div>

            {/* 진척도 표시 */}
            <div className="progress-container">
                <p className="progress-text">진척도: {progressRate}%</p>
                <div className="progress-bar-background">
                    <div className="progress-bar-fill" style={progressBarStyles}></div>
                </div>
            </div>

            {/* 협업자 목록 표시 */}
            <div className="co-workers-group">
                <span className="info-label">협업자:</span>
                <div className="avatar-group">
                    {coWorkerNames && coWorkerNames.slice(0, 3).map((name, index) => (
                        <span key={index} className="avatar-item">
                            {name.charAt(0)}
                        </span>
                    ))}
                    {coWorkerNames && coWorkerNames.length > 3 && (
                        <span className="more-avatar-count">+{coWorkerNames.length - 3}</span>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ProjectCard;