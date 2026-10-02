import type { ReactNode } from 'react';

import { Footer } from '@/components/layout/Footer';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { ScrollProgress } from '@/components/motion/MotionPrimitives';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="public-editorial flex min-h-screen flex-col bg-background text-foreground selection:bg-primary/20">
      <ScrollProgress />
      <PublicHeader />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
