import { useState } from 'react';
import { View, ScrollView, Image, Alert, Linking, Modal, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft, MapPin, Star, Clock, CheckCircle, UserX, UserCheck,
  UserPlus, UserMinus, Video, Award, Dumbbell, MessageCircle,
  Phone, Home, Car, ArrowLeftRight, ShoppingBag, BookOpen, X,
} from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { Text, Button, Input, Card, CardContent, Skeleton, Badge } from '@/components/ui';
import { useTrainerByHandle } from '@/api/trainer';
import { useAuth } from '@/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { TRAINER_SERVICES, TRAINER_QUALIFICATIONS } from '@fitnassist/schemas';
import Constants from 'expo-constants';
import { colors } from '@/constants/theme';
import { GradientBackground } from '@/components/GradientBackground';

const GOOGLE_API_KEY = Constants.expoConfig?.extra?.googleMapsApiKey ?? '';
const screenWidth = Dimensions.get('window').width;

const getServiceLabel = (value: string) => TRAINER_SERVICES.find((s) => s.value === value)?.label ?? value.replace(/-/g, ' ');
const getQualLabel = (value: string) => TRAINER_QUALIFICATIONS.find((q) => q.value === value)?.label ?? value.replace(/-/g, ' ');
const getPostcodeArea = (postcode?: string | null) => postcode?.split(' ')[0] ?? postcode;
const formatRate = (min?: number | null, max?: number | null) => {
  if (!min && !max) return null;
  const fMin = min ? `£${(min / 100).toFixed(0)}` : null;
  const fMax = max ? `£${(max / 100).toFixed(0)}` : null;
  if (fMin && fMax && min !== max) return `${fMin} - ${fMax}/hr`;
  if (fMin) return `From ${fMin}/hr`;
  if (fMax) return `Up to ${fMax}/hr`;
  return null;
};

const TRAVEL_INFO: Record<string, { icon: any; label: string; desc: string }> = {
  CLIENT_TRAVELS: { icon: Home, label: 'Studio/Gym Based', desc: 'Clients travel to the trainer' },
  TRAINER_TRAVELS: { icon: Car, label: 'Mobile Trainer', desc: 'Trainer travels to clients' },
  BOTH: { icon: ArrowLeftRight, label: 'Flexible Location', desc: 'Both options available' },
};

const TrainerProfileScreen = () => {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const router = useRouter();
  const { user, role } = useAuth();
  const { data: trainer, isLoading } = useTrainerByHandle(handle ?? '');
  const [galleryImage, setGalleryImage] = useState<string | null>(null);
  const [showConnect, setShowConnect] = useState(false);
  const [showCallback, setShowCallback] = useState(false);
  const [connectMsg, setConnectMsg] = useState('');
  const [callbackPhone, setCallbackPhone] = useState('');
  const [callbackMsg, setCallbackMsg] = useState('');

  // Follow
  const isFollowingQuery = trpc.follow.isFollowing.useQuery(
    { followingId: (trainer as any)?.userId ?? '' },
    { enabled: !!user && !!(trainer as any)?.userId && role === 'TRAINEE' },
  );
  const followCounts = trpc.follow.getFollowCounts.useQuery(
    { userId: (trainer as any)?.userId ?? '' },
    { enabled: !!(trainer as any)?.userId },
  );
  const followMut = trpc.follow.follow.useMutation();
  const unfollowMut = trpc.follow.unfollow.useMutation();
  const followUtils = trpc.useUtils();
  const isFollowing = (isFollowingQuery.data as any)?.isFollowing ?? false;
  const followers = (followCounts.data as any)?.followers ?? 0;

  // Contact
  const pendingCheck = trpc.contact.checkPendingRequest.useQuery(
    { trainerId: (trainer as any)?.id ?? '' },
    { enabled: !!user && !!(trainer as any)?.id && role === 'TRAINEE' },
  );
  const submitConnect = trpc.contact.submitConnectionRequest.useMutation();
  const submitCallback = trpc.contact.submitCallbackRequest.useMutation();
  const isPending = (pendingCheck.data as any)?.hasPending ?? false;
  const isConnected = (pendingCheck.data as any)?.isConnected ?? false;
  const connectionId = (pendingCheck.data as any)?.connectionId;

  // Reviews
  const reviewsQuery = trpc.review.getByTrainer.useInfiniteQuery(
    { trainerId: (trainer as any)?.id ?? '', limit: 5 },
    { enabled: !!(trainer as any)?.id, getNextPageParam: (last: any) => last.nextCursor },
  );
  const reviews = reviewsQuery.data?.pages.flatMap((p: any) => p.reviews ?? []) ?? [];

  // Products & Blog (Elite)
  const hasWebsite = (trainer as any)?.website?.subdomain && (trainer as any)?.website?.status === 'PUBLISHED';
  const productsQuery = trpc.product.getTopSelling.useQuery(
    { trainerId: (trainer as any)?.id ?? '', limit: 3 },
    { enabled: !!(trainer as any)?.id && hasWebsite },
  );
  const blogQuery = trpc.blog.getPublicPosts.useQuery(
    { subdomain: (trainer as any)?.website?.subdomain ?? '', limit: 3 },
    { enabled: hasWebsite },
  );
  const products = (productsQuery.data ?? []) as any[];
  const blogPosts = (blogQuery.data as any)?.posts ?? blogQuery.data ?? [];

  const t = trainer as any;

  const handleFollow = () => {
    const userId = t?.userId;
    const onSuccess = () => {
      followUtils.follow.isFollowing.invalidate({ followingId: userId });
      followUtils.follow.getFollowCounts.invalidate({ userId });
    };
    if (isFollowing) {
      unfollowMut.mutate({ followingId: userId }, { onSuccess });
    } else {
      followMut.mutate({ followingId: userId }, { onSuccess });
    }
  };

  const handleConnect = () => {
    if (!connectMsg.trim()) { Alert.alert('Error', 'Please enter a message'); return; }
    submitConnect.mutate({ trainerId: t?.id, message: connectMsg } as any, {
      onSuccess: () => { setShowConnect(false); setConnectMsg(''); Alert.alert('Sent', 'Connection request sent!'); pendingCheck.refetch(); },
      onError: () => Alert.alert('Error', 'Failed to send request'),
    });
  };

  const handleCallback = () => {
    if (!callbackPhone.trim()) { Alert.alert('Error', 'Please enter your phone number'); return; }
    submitCallback.mutate({ trainerId: t?.id, phone: callbackPhone, message: callbackMsg || undefined } as any, {
      onSuccess: () => { setShowCallback(false); setCallbackPhone(''); setCallbackMsg(''); Alert.alert('Sent', 'Callback request sent!'); pendingCheck.refetch(); },
      onError: () => Alert.alert('Error', 'Failed to send request'),
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Skeleton className="h-5 w-32 rounded" />
        </View>
        <View className="gap-4 py-4">
          <Skeleton className="h-48 w-full" />
          <View className="px-4 gap-3">
            <Skeleton className="h-6 w-40 rounded" />
            <Skeleton className="h-32 rounded-lg" />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!trainer) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text className="text-base font-semibold text-foreground">Trainer</Text>
        </View>
        <View className="flex-1 items-center justify-center gap-3">
          <UserX size={48} color={colors.mutedForeground} />
          <Text className="text-lg text-foreground">Profile Not Found</Text>
          <Text className="text-sm text-muted-foreground text-center px-8">This trainer profile doesn't exist or has been removed.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const rate = formatRate(t.hourlyRateMin, t.hourlyRateMax);
  const travelInfo = TRAVEL_INFO[t.travelOption];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <ScrollView className="flex-1" contentContainerClassName="pb-24">
        {/* Hero with cover */}
        <View className="relative">
          {t.coverImageUrl ? (
            <Image source={{ uri: t.coverImageUrl }} className="w-full h-48" resizeMode="cover" />
          ) : (
            <GradientBackground style={{ height: 192 }}><View /></GradientBackground>
          )}
          {/* Back button overlay */}
          <TouchableOpacity className="absolute top-12 left-4 w-9 h-9 rounded-full bg-black/40 items-center justify-center" onPress={() => router.back()}>
            <ArrowLeft size={20} color="#fff" />
          </TouchableOpacity>
          {/* Avatar overlay */}
          <View className="absolute -bottom-12 left-4">
            {t.profileImageUrl ? (
              <Image source={{ uri: t.profileImageUrl }} className="w-24 h-24 rounded-full border-4 border-background" />
            ) : (
              <View className="w-24 h-24 rounded-full border-4 border-background bg-secondary items-center justify-center">
                <Text className="text-2xl font-bold text-foreground">{t.displayName?.charAt(0)}</Text>
              </View>
            )}
          </View>
        </View>

        <View className="mt-14 px-4 gap-1">
          <Text className="text-2xl font-extralight text-foreground uppercase" style={{ letterSpacing: 2 }}>{t.displayName}</Text>
          {(t.city || t.postcode) && (
            <View className="flex-row items-center gap-1">
              <MapPin size={14} color={colors.mutedForeground} />
              <Text className="text-sm text-muted-foreground">{t.city}{t.postcode ? `, ${getPostcodeArea(t.postcode)} area` : ''}</Text>
            </View>
          )}
          <View className="flex-row items-center gap-3 mt-1">
            {t.ratingCount > 0 && (
              <View className="flex-row items-center gap-1">
                <Star size={14} color={colors.teal} fill={colors.teal} />
                <Text className="text-sm text-foreground">{t.ratingAverage?.toFixed(1)} ({t.ratingCount})</Text>
              </View>
            )}
            {rate && (
              <View className="flex-row items-center gap-1">
                <Clock size={14} color={colors.mutedForeground} />
                <Text className="text-sm text-foreground">{rate}</Text>
              </View>
            )}
          </View>
          <View className="flex-row items-center gap-1 mt-1">
            {t.acceptingClients ? (
              <><UserCheck size={14} color={colors.teal} /><Text className="text-sm text-teal">Accepting clients</Text></>
            ) : (
              <><UserX size={14} color={colors.mutedForeground} /><Text className="text-sm text-muted-foreground">Not accepting clients</Text></>
            )}
          </View>
        </View>

        {/* Follow */}
        {user && role === 'TRAINEE' && t.userId !== user.id && (
          <View className="flex-row items-center gap-3 px-4 mt-3">
            <Button size="sm" variant={isFollowing ? 'outline' : 'default'} onPress={handleFollow}>
              <View className="flex-row items-center gap-1">
                {isFollowing ? <UserMinus size={14} color={colors.foreground} /> : <UserPlus size={14} color="#fff" />}
                <Text className={`text-sm font-semibold ${isFollowing ? 'text-foreground' : 'text-white'}`}>{isFollowing ? 'Following' : 'Follow'}</Text>
              </View>
            </Button>
            <Text className="text-sm text-muted-foreground">{followers} followers</Text>
          </View>
        )}

        <View className="px-4 mt-4 gap-4">
          {/* Bio */}
          {t.bio && (
            <Card>
              <CardContent className="py-4 px-4 gap-2">
                <Text className="text-sm font-extralight text-foreground uppercase" style={{ letterSpacing: 1 }}>About</Text>
                <Text className="text-sm text-muted-foreground">{t.bio}</Text>
              </CardContent>
            </Card>
          )}

          {/* Video Intro */}
          {t.videoIntroUrl && (
            <Card>
              <CardContent className="py-4 px-4 gap-2">
                <View className="flex-row items-center gap-2">
                  <Video size={16} color={colors.teal} />
                  <Text className="text-sm font-extralight text-foreground uppercase" style={{ letterSpacing: 1 }}>Introduction</Text>
                </View>
                <TouchableOpacity onPress={() => Linking.openURL(t.videoIntroUrl)}>
                  <View className="bg-secondary rounded-lg h-32 items-center justify-center">
                    <Video size={32} color={colors.teal} />
                    <Text className="text-xs text-teal mt-1">Tap to play video</Text>
                  </View>
                </TouchableOpacity>
              </CardContent>
            </Card>
          )}

          {/* Gallery */}
          {t.galleryImages?.length > 0 && (
            <Card>
              <CardContent className="py-4 px-4 gap-2">
                <Text className="text-sm font-extralight text-foreground uppercase" style={{ letterSpacing: 1 }}>Gallery</Text>
                <View className="flex-row flex-wrap gap-2">
                  {t.galleryImages.map((img: any) => (
                    <TouchableOpacity key={img.id} onPress={() => setGalleryImage(typeof img === 'string' ? img : img.url)} style={{ width: (screenWidth - 48) / 3 }}>
                      <Image source={{ uri: typeof img === 'string' ? img : img.url }} style={{ width: '100%', aspectRatio: 1, borderRadius: 8 }} resizeMode="cover" />
                    </TouchableOpacity>
                  ))}
                </View>
              </CardContent>
            </Card>
          )}

          {/* Services */}
          {t.services?.length > 0 && (
            <Card>
              <CardContent className="py-4 px-4 gap-2">
                <View className="flex-row items-center gap-2">
                  <Dumbbell size={16} color={colors.teal} />
                  <Text className="text-sm font-extralight text-foreground uppercase" style={{ letterSpacing: 1 }}>Services</Text>
                </View>
                <View className="flex-row flex-wrap gap-1">
                  {t.services.map((s: string) => <Badge key={s}>{getServiceLabel(s)}</Badge>)}
                </View>
              </CardContent>
            </Card>
          )}

          {/* Qualifications */}
          {t.qualifications?.length > 0 && (
            <Card>
              <CardContent className="py-4 px-4 gap-2">
                <View className="flex-row items-center gap-2">
                  <Award size={16} color={colors.teal} />
                  <Text className="text-sm font-extralight text-foreground uppercase" style={{ letterSpacing: 1 }}>Qualifications</Text>
                </View>
                <View className="flex-row flex-wrap gap-1">
                  {t.qualifications.map((q: string) => <Badge key={q} variant="secondary">{getQualLabel(q)}</Badge>)}
                </View>
              </CardContent>
            </Card>
          )}

          {/* Location + Map */}
          {(t.latitude && t.longitude) && (
            <Card>
              <CardContent className="py-4 px-4 gap-2">
                <View className="flex-row items-center gap-2">
                  <MapPin size={16} color={colors.teal} />
                  <Text className="text-sm font-extralight text-foreground uppercase" style={{ letterSpacing: 1 }}>Location</Text>
                </View>
                {GOOGLE_API_KEY && (
                  <Image
                    source={{ uri: `https://maps.googleapis.com/maps/api/staticmap?center=${t.latitude},${t.longitude}&zoom=12&size=400x200&scale=2&key=${GOOGLE_API_KEY}` }}
                    className="w-full h-32 rounded-lg"
                    resizeMode="cover"
                  />
                )}
                <Text className="text-sm font-medium text-foreground">{t.city}</Text>
                {t.postcode && <Text className="text-xs text-muted-foreground">{getPostcodeArea(t.postcode)} area</Text>}
                {travelInfo && (
                  <View className="flex-row items-center gap-2 bg-secondary rounded-lg p-2 mt-1">
                    <travelInfo.icon size={16} color={colors.teal} />
                    <View>
                      <Text className="text-xs font-medium text-foreground">{travelInfo.label}</Text>
                      <Text className="text-[10px] text-muted-foreground">{travelInfo.desc}</Text>
                    </View>
                  </View>
                )}
              </CardContent>
            </Card>
          )}

          {/* Reviews */}
          {reviews.length > 0 && (
            <Card>
              <CardContent className="py-4 px-4 gap-3">
                <View className="flex-row items-center gap-2">
                  <Star size={16} color={colors.teal} />
                  <Text className="text-sm font-extralight text-foreground uppercase" style={{ letterSpacing: 1 }}>Reviews</Text>
                </View>
                {t.ratingCount > 0 && (
                  <View className="flex-row items-center gap-2 pb-2 border-b border-border">
                    <Text className="text-2xl font-bold text-foreground">{t.ratingAverage?.toFixed(1)}</Text>
                    <View className="flex-row gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={14} color={colors.teal} fill={i <= Math.round(t.ratingAverage ?? 0) ? colors.teal : 'transparent'} />)}
                    </View>
                    <Text className="text-sm text-muted-foreground">({t.ratingCount})</Text>
                  </View>
                )}
                {reviews.slice(0, 5).map((review: any) => (
                  <View key={review.id} className="gap-1 py-2 border-b border-border">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-sm font-medium text-foreground">{review.reviewer?.name ?? 'Anonymous'}</Text>
                      <View className="flex-row gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={10} color={colors.teal} fill={i <= review.rating ? colors.teal : 'transparent'} />)}
                      </View>
                    </View>
                    <Text className="text-sm text-muted-foreground">{review.text}</Text>
                    {review.replyText && (
                      <View className="ml-4 border-l-2 border-teal pl-3 mt-1">
                        <Text className="text-xs text-muted-foreground">Trainer reply</Text>
                        <Text className="text-xs text-foreground">{review.replyText}</Text>
                      </View>
                    )}
                  </View>
                ))}
                {reviewsQuery.hasNextPage && (
                  <TouchableOpacity onPress={() => reviewsQuery.fetchNextPage()}>
                    <Text className="text-sm text-teal text-center py-2">Load more reviews</Text>
                  </TouchableOpacity>
                )}
              </CardContent>
            </Card>
          )}

          {/* Products (Elite) */}
          {products.length > 0 && (
            <Card>
              <CardContent className="py-4 px-4 gap-2">
                <View className="flex-row items-center gap-2">
                  <ShoppingBag size={16} color={colors.teal} />
                  <Text className="text-sm font-extralight text-foreground uppercase" style={{ letterSpacing: 1 }}>Top Products</Text>
                </View>
                {products.map((p: any) => (
                  <View key={p.id} className="flex-row items-center gap-3 py-2 border-b border-border">
                    <Text className="text-sm text-foreground flex-1">{p.name}</Text>
                    <Text className="text-sm font-medium text-teal">£{((p.priceInCents ?? 0) / 100).toFixed(2)}</Text>
                  </View>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Blog (Elite) */}
          {(blogPosts as any[]).length > 0 && (
            <Card>
              <CardContent className="py-4 px-4 gap-2">
                <View className="flex-row items-center gap-2">
                  <BookOpen size={16} color={colors.teal} />
                  <Text className="text-sm font-extralight text-foreground uppercase" style={{ letterSpacing: 1 }}>Blog</Text>
                </View>
                {(blogPosts as any[]).map((post: any) => (
                  <View key={post.id} className="py-2 border-b border-border">
                    <Text className="text-sm font-medium text-foreground">{post.title}</Text>
                    {post.excerpt && <Text className="text-xs text-muted-foreground" numberOfLines={2}>{post.excerpt}</Text>}
                  </View>
                ))}
              </CardContent>
            </Card>
          )}
        </View>
      </ScrollView>

      {/* Fixed bottom CTA */}
      {user && role === 'TRAINEE' && t.userId !== user.id && (
        <View className="absolute bottom-0 left-0 right-0 bg-background border-t border-border px-4 pt-3 pb-6">
          {isConnected ? (
            <Button onPress={() => connectionId && router.push(`/messages/${connectionId}`)}>
              <View className="flex-row items-center gap-2">
                <MessageCircle size={16} color="#fff" />
                <Text className="text-white font-semibold">Send Message</Text>
              </View>
            </Button>
          ) : isPending ? (
            <Button disabled variant="outline">Request Pending</Button>
          ) : (
            <View className="flex-row gap-2">
              <Button variant="outline" className="flex-1" onPress={() => setShowCallback(true)}>
                <View className="flex-row items-center gap-1">
                  <Phone size={14} color={colors.foreground} />
                  <Text className="text-foreground font-semibold">Callback</Text>
                </View>
              </Button>
              <Button className="flex-1" onPress={() => setShowConnect(true)}>
                <View className="flex-row items-center gap-1">
                  <UserPlus size={14} color="#fff" />
                  <Text className="text-white font-semibold">Connect</Text>
                </View>
              </Button>
            </View>
          )}
        </View>
      )}

      {/* Gallery Lightbox */}
      <Modal visible={!!galleryImage} transparent animationType="fade" onRequestClose={() => setGalleryImage(null)}>
        <View className="flex-1 bg-black items-center justify-center">
          <TouchableOpacity className="absolute top-14 right-4 z-10" onPress={() => setGalleryImage(null)}>
            <X size={28} color="#fff" />
          </TouchableOpacity>
          {galleryImage && <Image source={{ uri: galleryImage }} style={{ width: screenWidth, height: screenWidth }} resizeMode="contain" />}
        </View>
      </Modal>

      {/* Connect Modal */}
      <Modal visible={showConnect} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowConnect(false)}>
        <SafeAreaView className="flex-1 bg-background">
          <View className="flex-row items-center justify-between px-4 py-4 border-b border-border">
            <Text className="text-base font-semibold text-foreground">Request to Connect</Text>
            <TouchableOpacity onPress={() => setShowConnect(false)}><X size={24} color={colors.foreground} /></TouchableOpacity>
          </View>
          <View className="px-4 py-4 gap-4">
            <Input label="Message" value={connectMsg} onChangeText={setConnectMsg} placeholder="Introduce yourself and why you'd like to connect..." multiline numberOfLines={4} style={{ minHeight: 80, textAlignVertical: 'top' }} />
            <Text className="text-xs text-muted-foreground">Your contact details will only be shared with this trainer.</Text>
            <Button onPress={handleConnect} loading={submitConnect.isPending}>Send Request</Button>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Callback Modal */}
      <Modal visible={showCallback} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowCallback(false)}>
        <SafeAreaView className="flex-1 bg-background">
          <View className="flex-row items-center justify-between px-4 py-4 border-b border-border">
            <Text className="text-base font-semibold text-foreground">Request a Callback</Text>
            <TouchableOpacity onPress={() => setShowCallback(false)}><X size={24} color={colors.foreground} /></TouchableOpacity>
          </View>
          <View className="px-4 py-4 gap-4">
            <Input label="Phone Number" value={callbackPhone} onChangeText={setCallbackPhone} placeholder="+447123456789" keyboardType="phone-pad" />
            <Input label="Message (optional)" value={callbackMsg} onChangeText={setCallbackMsg} placeholder="Any details about what you're looking for..." multiline style={{ minHeight: 60, textAlignVertical: 'top' }} />
            <Text className="text-xs text-muted-foreground">Your contact details will only be shared with this trainer.</Text>
            <Button onPress={handleCallback} loading={submitCallback.isPending}>Request Callback</Button>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default TrainerProfileScreen;
