import { useState, useMemo } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { Input, Card, CardContent } from '@/components/ui';
import { HeroBanner } from '@/components/HeroBanner';
import { cn } from '@/lib/utils';
import { helpArticles, HELP_CATEGORIES } from './help.data';
import type { HelpCategory } from './help.types';

export const HelpCentrePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<HelpCategory | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredArticles = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return helpArticles.filter((article) => {
      const matchesCategory = activeCategory === 'all' || article.category === activeCategory;

      if (!matchesCategory) return false;

      if (!query) return true;

      return (
        article.title.toLowerCase().includes(query) ||
        article.keywords.some((kw) => kw.toLowerCase().includes(query))
      );
    });
  }, [searchQuery, activeCategory]);

  const toggleArticle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div>
      <HeroBanner title="Help Centre" imageUrl="/images/hero-support.jpg" size="small" />

      <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search help articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {HELP_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setActiveCategory(cat.value)}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                activeCategory === cat.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80',
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Articles */}
        {filteredArticles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No articles found. Try a different search term or category.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredArticles.map((article) => {
              const isExpanded = expandedId === article.id;
              const preview = article.content.replace(/<[^>]*>/g, '').slice(0, 120);

              return (
                <Card key={article.id}>
                  <button
                    type="button"
                    onClick={() => toggleArticle(article.id)}
                    className="w-full text-left"
                  >
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-foreground">{article.title}</h3>
                          {!isExpanded && (
                            <p className="text-sm text-muted-foreground mt-1 truncate">
                              {preview}...
                            </p>
                          )}
                        </div>
                        <ChevronDown
                          className={cn(
                            'h-5 w-5 text-muted-foreground shrink-0 transition-transform',
                            isExpanded && 'rotate-180',
                          )}
                        />
                      </div>
                    </CardContent>
                  </button>
                  {isExpanded && (
                    <CardContent className="px-4 pb-5 sm:px-5 pt-0">
                      <div
                        className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground [&_p]:mb-3 [&_p:last-child]:mb-0"
                        dangerouslySetInnerHTML={{ __html: article.content }}
                      />
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
