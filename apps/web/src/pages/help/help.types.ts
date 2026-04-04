export type HelpCategory = 'getting-started' | 'trainee' | 'trainer' | 'account';

export interface HelpArticle {
  id: string;
  title: string;
  category: HelpCategory;
  content: string;
  keywords: string[];
}
