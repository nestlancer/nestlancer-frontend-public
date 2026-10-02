import type { Project } from '@nestlancer/types';
import { Card, CardContent, CardHeader, CardTitle, DomainStatusBadge } from '@nestlancer/ui';

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{project.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="line-clamp-2 text-sm text-muted-foreground">{project.description}</p>
        <div className="mt-2">
          <DomainStatusBadge domain="project" status={project.status} />
        </div>
      </CardContent>
    </Card>
  );
}
