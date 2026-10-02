import { Spinner } from '@nestlancer/ui';

export default function RegisterLoading() {
  return (
    <div className="flex justify-center py-12">
      <Spinner />
    </div>
  );
}
