import type { Metadata } from 'next';
import { AdminBlogPostEditorClient } from '@/features/content/AdminBlogPostEditorClient';

export const metadata: Metadata = { title: 'New post' };

export default function NewBlogPostPage() {
  return <AdminBlogPostEditorClient />;
}
