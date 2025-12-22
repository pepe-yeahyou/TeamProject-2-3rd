import React from 'react';
import ProjectCard from './ProjectCard'; 

function ProjectList({ projects }) {
    if (!projects || projects.length === 0) {
        return (
            <div className="no-project-container">
                <p>참여 중인 프로젝트가 없습니다.</p>
            </div>
        );
    }

    return (
        <div className="project-list-container">
            <h2 className="section-title">프로젝트 목록</h2> 
            <div className="project-grid">
                {projects.map((project) => (
                    <ProjectCard key={project.projectId} project={project} />
                ))}
            </div>
        </div>
    );
}

export default ProjectList;