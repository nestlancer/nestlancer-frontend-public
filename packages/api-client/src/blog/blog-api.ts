import type { BlogListResult } from '@nestlancer/types';

import { getBlog } from '../generated/blog/blog';

const blogClient = getBlog();

export type ListBlogPostsParams = {
  page?: number;
  limit?: number;
  categoryId?: string;
  tag?: string;
};

/** Server-side blog list via generated Orval client (envelope unwrapped in `customInstance`). */
export async function listBlogPosts(params?: ListBlogPostsParams): Promise<BlogListResult> {
  const { tag, ...rest } = params ?? {};
  if (tag) {
    const data = await blogClient.gatewayBlogControllerListPosts({
      ...rest,
      tag,
    } as Parameters<typeof blogClient.gatewayBlogControllerListPosts>[0]);
    return data as unknown as BlogListResult;
  }
  const data = await blogClient.gatewayBlogControllerListPosts(rest);
  return data as unknown as BlogListResult;
}

export async function searchBlogPosts(params: { q: string }): Promise<unknown> {
  return blogClient.gatewayBlogControllerSearchPosts(params);
}
