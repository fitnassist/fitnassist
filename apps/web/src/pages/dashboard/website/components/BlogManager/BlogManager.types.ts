export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImageUrl: string | null;
  status: string;
  publishedAt: string | Date | null;
  seoTitle: string | null;
  seoDescription: string | null;
  tags: string[];
  createdAt: string | Date;
  updatedAt: string | Date;
}
