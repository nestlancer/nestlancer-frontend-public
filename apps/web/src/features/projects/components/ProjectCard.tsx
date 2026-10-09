import type { Project } from '@nestlancer/types';
import { Card, CardContent, CardHeader, CardTitle, DomainStatusBadge } from '@nestlancer/ui';

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base" title={project.title}>
          {project.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="line-clamp-2 text-sm text-muted-foreground" title={project.description}>
          {project.description}
        </p>
        <div className="mt-2">
          <DomainStatusBadge domain="project" status={project.status} />
        </div>
      </CardContent>
    </Card>
  );
}
