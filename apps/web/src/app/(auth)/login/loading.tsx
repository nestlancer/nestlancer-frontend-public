import { Spinner } from '@nestlancer/ui';

export default function LoginLoading() {
  return (
    <div className="flex justify-center py-12">
      <Spinner />
    </div>
  );
}
