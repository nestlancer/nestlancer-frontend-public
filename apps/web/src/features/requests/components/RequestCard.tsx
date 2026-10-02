import type { ProjectRequest } from '@nestlancer/types';
import { Card, CardContent, CardHeader, CardTitle } from '@nestlancer/ui';

export function RequestCard({ request }: { request: ProjectRequest }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{request.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{request.status}</p>
      </CardContent>
    </Card>
  );
}
