import type { ApiUserProfile } from '@nestlancer/types';

export function ProfileHeader({ profile }: { profile: ApiUserProfile }) {
  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-bold">
        {profile.firstName} {profile.lastName}
      </h1>
      {profile.headline ? <p className="text-muted-foreground">{profile.headline}</p> : null}
    </div>
  );
}
