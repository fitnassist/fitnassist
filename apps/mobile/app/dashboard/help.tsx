import { useState, useCallback } from "react";
import { View, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Search, ChevronDown, ChevronUp } from "lucide-react-native";
import { Text, Card, CardContent } from "@/components/ui";
import { colors } from "@/constants/theme";
import {
  helpArticles,
  HELP_CATEGORIES,
  type HelpCategory,
  type HelpArticle,
} from "@/constants/helpArticles";

const CategoryPill = ({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    className={`px-4 py-2 rounded-full mr-2 ${active ? "bg-teal" : "bg-card border border-border"}`}
    activeOpacity={0.6}
    onPress={onPress}
  >
    <Text
      className={`text-sm font-medium ${active ? "text-teal-foreground" : "text-muted-foreground"}`}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const ArticleItem = ({ article }: { article: HelpArticle }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => setExpanded(!expanded)}
      className="py-3.5 border-b border-border"
    >
      <View className="flex-row items-center justify-between">
        <Text className="flex-1 text-sm font-medium text-foreground pr-2">
          {article.title}
        </Text>
        {expanded ? (
          <ChevronUp size={16} color={colors.mutedForeground} />
        ) : (
          <ChevronDown size={16} color={colors.mutedForeground} />
        )}
      </View>
      {expanded && (
        <Text className="text-sm text-muted-foreground mt-2 leading-5">
          {article.content}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const HelpScreen = () => {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<HelpCategory>("all");

  const filterArticles = useCallback((): HelpArticle[] => {
    let filtered = helpArticles;

    if (category !== "all") {
      filtered = filtered.filter((a) => a.category === category);
    }

    if (search.trim()) {
      const query = search.trim().toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(query) ||
          a.content.toLowerCase().includes(query) ||
          a.keywords.some((k) => k.toLowerCase().includes(query)),
      );
    }

    return filtered;
  }, [search, category]);

  const articles = filterArticles();

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-foreground">
          Help Centre
        </Text>
      </View>

      {/* Search */}
      <View className="px-4 pt-4 pb-2">
        <View className="flex-row items-center bg-card border border-border rounded-lg px-3 h-11">
          <Search size={16} color={colors.mutedForeground} />
          <TextInput
            className="flex-1 ml-2 text-sm text-foreground"
            placeholder="Search articles..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      {/* Category pills */}
      <View className="px-4 py-2">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {HELP_CATEGORIES.map((cat) => (
            <CategoryPill
              key={cat.key}
              label={cat.label}
              active={category === cat.key}
              onPress={() => setCategory(cat.key)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Articles */}
      <ScrollView className="flex-1" contentContainerClassName="px-4 pb-8">
        {articles.length === 0 ? (
          <View className="items-center justify-center py-12 gap-2">
            <Text className="text-base text-muted-foreground">
              No articles found.
            </Text>
            <Text className="text-sm text-muted-foreground">
              Try a different search term or category.
            </Text>
          </View>
        ) : (
          <Card>
            <CardContent className="py-1 px-4">
              {articles.map((article) => (
                <ArticleItem key={article.id} article={article} />
              ))}
            </CardContent>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default HelpScreen;
