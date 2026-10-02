import type { Metadata } from 'next';
import { AdminBlogPostEditorClient } from '@/features/content/AdminBlogPostEditorClient';

export const metadata: Metadata = { title: 'Edit post' };

export default function EditBlogPostPage({ params }: { params: { id: string } }) {
  return <AdminBlogPostEditorClient postId={params.id} />;
}
