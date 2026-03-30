import { View, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Globe, ExternalLink, Palette, Layout, FileText } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { Text, Button, Card, CardContent, Skeleton, Badge } from '@/components/ui';
import { trpc } from '@/lib/trpc';
import { useMyTrainerProfile } from '@/api/trainer';
import { colors } from '@/constants/theme';

const apiUrl = Constants.expoConfig?.extra?.apiUrl ?? 'http://localhost:3001';
const webUrl = apiUrl.replace(':3001', ':5173');

const WebsiteScreen = () => {
  const router = useRouter();
  const { data: profile, isLoading } = useMyTrainerProfile();
  const { data: website, refetch } = trpc.website.get.useQuery(undefined, {
    retry: false,
  });

  const isPublished = website?.isPublished ?? false;

  const openEditor = () => {
    WebBrowser.openBrowserAsync(`${webUrl}/dashboard/website`);
  };

  const openSite = () => {
    if (profile?.handle) {
      WebBrowser.openBrowserAsync(`${webUrl}/trainers/${profile.handle}`);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-foreground">Website Builder</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 py-4 gap-4 pb-8"
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.teal} />}
      >
        {isLoading ? (
          <View className="gap-4">
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-48 rounded-lg" />
          </View>
        ) : (
          <>
            {/* Status Card */}
            <Card>
              <CardContent className="py-5 px-4 gap-3">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <Globe size={20} color={colors.teal} />
                    <Text className="text-lg font-semibold text-foreground">Your Website</Text>
                  </View>
                  <Badge variant={isPublished ? 'default' : 'secondary'}>
                    {isPublished ? 'Published' : 'Draft'}
                  </Badge>
                </View>

                {profile?.handle && (
                  <Text className="text-sm text-muted-foreground">
                    fitnassist.co/trainers/{profile.handle}
                  </Text>
                )}

                <View className="flex-row gap-2">
                  <Button onPress={openEditor} className="flex-1">
                    Edit Website
                  </Button>
                  {isPublished && (
                    <Button variant="outline" onPress={openSite} className="flex-1">
                      <View className="flex-row items-center gap-1">
                        <ExternalLink size={14} color={colors.foreground} />
                        <Text className="text-sm font-semibold text-foreground">View</Text>
                      </View>
                    </Button>
                  )}
                </View>
              </CardContent>
            </Card>

            {/* Quick access cards */}
            <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>
              Quick Edit
            </Text>

            <TouchableOpacity onPress={openEditor}>
              <Card>
                <CardContent className="py-4 px-4 flex-row items-center gap-3">
                  <Palette size={20} color={colors.teal} />
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-foreground">Theme & Colors</Text>
                    <Text className="text-xs text-muted-foreground">Customize your site appearance</Text>
                  </View>
                </CardContent>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity onPress={openEditor}>
              <Card>
                <CardContent className="py-4 px-4 flex-row items-center gap-3">
                  <Layout size={20} color={colors.teal} />
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-foreground">Sections</Text>
                    <Text className="text-xs text-muted-foreground">Add and arrange page sections</Text>
                  </View>
                </CardContent>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity onPress={openEditor}>
              <Card>
                <CardContent className="py-4 px-4 flex-row items-center gap-3">
                  <FileText size={20} color={colors.teal} />
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-foreground">Blog</Text>
                    <Text className="text-xs text-muted-foreground">Manage your blog posts</Text>
                  </View>
                </CardContent>
              </Card>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default WebsiteScreen;
