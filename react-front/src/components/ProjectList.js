import React from 'react';
import ProjectCard from './ProjectCard'; 

function ProjectList({ projects }) {

    if (!projects || projects.length === 0) {
        return (
            <div className="no-project-container">
                <p>아직 참여하고 있는 프로젝트가 없습니다.</p>
            </div>
        );
    }

    return (
        <div className="project-list-container">
            {/* Dashboard.css에 정의된 section-title 클래스 재사용 */}
            <h2 className="section-title">나의 프로젝트</h2> 
            <div className="project-grid">
                {projects.map((project) => (
                    <ProjectCard key={project.projectId} project={project} />
                ))}
            </div>
        </div>
    );
}

export default ProjectList;