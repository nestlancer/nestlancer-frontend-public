import type { PublicBlogPost } from '@nestlancer/types';

import { BlogPostCard } from './BlogPostCard';

type RelatedPost = Pick<
  PublicBlogPost,
  | 'id'
  | 'title'
  | 'slug'
  | 'excerpt'
  | 'publishedAt'
  | 'readingTime'
  | 'category'
  | 'seo'
  | 'author'
  | 'featured'
>;

type Props = {
  posts: RelatedPost[];
};

export function BlogRelatedGrid({ posts }: Props) {
  if (posts.length === 0) return null;

  return (
    <section className="mt-14 border-t border-article pt-10">
      <h2 className="font-display text-lg font-semibold tracking-tight text-article">
        Related posts
      </h2>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {posts.map((post) => (
          <BlogPostCard
            key={post.id}
            post={{
              content: '',
              ...post,
            }}
          />
        ))}
      </div>
    </section>
  );
}
