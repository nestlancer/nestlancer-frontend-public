/** Public portfolio list/detail (gateway `/portfolio`). */
export interface PortfolioCategorySummary {
  id: string;
  name: string;
  slug?: string;
}

export interface PortfolioGalleryImage {
  mediaId: string;
  url?: string | null;
  alt?: string | null;
  caption?: string | null;
  order?: number;
}

export type PortfolioPreviewMediaKind = 'IMAGE' | 'VIDEO' | 'DOCUMENT';

export interface PortfolioPreviewMedia {
  mediaId: string;
  kind: PortfolioPreviewMediaKind | string;
  title?: string | null;
  mimeType?: string | null;
  url?: string | null;
  alt?: string | null;
  caption?: string | null;
  order?: number;
}

export interface PortfolioClientReview {
  quote?: string;
  author?: string;
  role?: string | null;
  rating?: number | null;
  /** When false, review is hidden on the public showcase. Defaults to true when quote is set. */
  enabled?: boolean;
}

export interface PortfolioClientBlock {
  name?: string;
  industry?: string | null;
  website?: string | null;
  testimonial?: PortfolioClientReview | null;
}

export interface PortfolioProjectDetails {
  duration?: string;
  technologies?: string[];
  milestoneCount?: number;
  deliverableCount?: number;
}

export interface PortfolioLinks {
  live?: string;
  github?: string;
  caseStudy?: string;
}

export interface PublicPortfolioItem {
  id: string;
  title: string;
  slug: string;
  shortDescription?: string | null;
  fullDescription?: string | null;
  contentFormat?: string | null;
  tags?: string[];
  featured?: boolean;
  likeCount?: number;
  viewCount?: number;
  thumbnailUrl?: string | null;
  featuredVideoUrl?: string | null;
  gallery?: PortfolioGalleryImage[];
  previewMedia?: PortfolioPreviewMedia[];
  documents?: PortfolioPreviewMedia[];
  videos?: PortfolioPreviewMedia[];
  imageIds?: string[];
  client?: PortfolioClientBlock | null;
  projectDetails?: PortfolioProjectDetails | null;
  links?: PortfolioLinks | null;
  stats?: Record<string, unknown> | null;
  ctaReferenceId?: string;
  category?: PortfolioCategorySummary | null;
  status?: string;
  publishedAt?: string | null;
  completedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  order?: number;
}

export interface PortfolioListResult {
  items: PublicPortfolioItem[];
  totalItems: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

/** `GET /portfolio/timeline` — minimal fields for timeline UI. */
export interface PortfolioTimelineItem {
  id: string;
  title: string;
  slug: string;
  publishedAt?: string | null;
  completedAt?: string | null;
  createdAt?: string | null;
}

export interface PortfolioTimelineResult {
  items: PortfolioTimelineItem[];
}

/** Public blog list/detail (gateway `/blog/posts`). */
export interface BlogCategorySummary {
  id: string;
  name: string;
  slug: string;
  /** Present on `GET /blog/categories` list responses. */
  postCount?: number;
  /** Optional category blurb from the blog service. */
  description?: string | null;
}

export interface BlogTagSummary {
  id: string;
  name: string;
  slug: string;
}

export interface BlogAuthorSummary {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  avatar?: string | null;
}

export interface BlogSeoMeta {
  metaTitle?: string;
  metaDescription?: string;
  /** API may return `title` / `description` from admin create payloads. */
  title?: string;
  description?: string;
  ogImage?: string;
}

export interface BlogAdjacentPost {
  id: string;
  title: string;
  slug: string;
  publishedAt?: string | null;
}

export interface PublicBlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  contentFormat?: string | null;
  publishedAt?: string | null;
  readingTime?: number | null;
  category?: BlogCategorySummary | null;
  tags?: BlogTagSummary[];
  viewCount?: number;
  likeCount?: number;
  /** Approved comment count (public post detail). */
  commentCount?: number;
  /** Chronological neighbors on public post detail. */
  adjacent?: {
    previous?: BlogAdjacentPost | null;
    next?: BlogAdjacentPost | null;
  };
  /** Present when the request includes a valid Bearer token. */
  isLiked?: boolean;
  /** Present when the request includes a valid Bearer token. */
  isBookmarked?: boolean;
  authorId?: string;
  author?: BlogAuthorSummary | null;
  featured?: boolean;
  commentsEnabled?: boolean;
  seo?: BlogSeoMeta | null;
}

export interface BlogListResult {
  items: PublicBlogPost[];
  totalItems: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** `GET /projects` — client’s projects (summary rows from gateway). */
export interface ProjectSummary {
  id: string;
  title: string;
  status: string;
  createdAt: string;
}
