import { useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  Share,
  StyleSheet,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Colors, Spacing } from '@/constants/theme';
import { useAuth } from '../ctx';

type ScopeTab = 'All' | 'University' | 'Faculty' | 'Department';

interface Post {
  id: string;
  author: string;
  department: string;
  university: string;
  timestamp: string;
  content: string;
  likes: number;
  comments: number;
  liked?: boolean;
}

const INITIAL_POSTS: Post[] = [
  {
    id: '1',
    author: 'Rex',
    department: 'CPE',
    university: 'UNIPORT',
    timestamp: 'Nov 15, 03:20 AM',
    content: 'Hello',
    likes: 2,
    comments: 1,
  },
  {
    id: '2',
    author: 'Rex',
    department: 'CPE',
    university: 'UNIPORT',
    timestamp: 'Nov 07, 01:21 AM',
    content: 'New post',
    likes: 2,
    comments: 2,
  },
  {
    id: '3',
    author: 'Rex',
    department: 'PAD',
    university: 'KSUEIKS',
    timestamp: 'Oct 31, 08:59 PM',
    content: 'Yup, wolf is definitely arse',
    likes: 2,
    comments: 1,
  },
];

const TABS: ScopeTab[] = ['All', 'University', 'Faculty', 'Department'];

export default function FeedScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const [activeTab, setActiveTab] = useState<ScopeTab>('All');
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [refreshing, setRefreshing] = useState(false);

  const handleLogoutToSignup = async () => {
    await logout();
    //router.replace('/(auth)/signup' as any);
  };

  const toggleLike = (id: string) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === id
          ? {
              ...post,
              liked: !post.liked,
              likes: post.liked ? post.likes - 1 : post.likes + 1,
            }
          : post
      )
    );
  };

  const handleShare = async (post: Post) => {
    await Share.share({
      message: `${post.author} (${post.department} · ${post.university}): ${post.content}`,
    });
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <View style={styles.topBar}>
          <Pressable
            style={[
              styles.iconBtn,
              {
                backgroundColor: colors.backgroundElement,
                borderColor: colors.backgroundSelected,
              },
            ]}
            hitSlop={8}
          >
            <Ionicons name="menu-outline" size={22} color={colors.text} />
          </Pressable>

          <View style={styles.topRightRow}>
            <Pressable
              onPress={handleLogoutToSignup}
              style={({ pressed }) => [
                styles.logoutBtn,
                {
                  backgroundColor: colors.backgroundElement,
                  borderColor: colors.tint,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              hitSlop={8}
            >
              <Ionicons name="log-out-outline" size={16} color={colors.tint} />
              <ThemedText style={[styles.logoutText, { color: colors.tint }]}>
                Sign Up / Logout
              </ThemedText>
            </Pressable>
          </View>
        </View>

        <View
          style={[
            styles.filterBar,
            {
              backgroundColor: colors.backgroundElement,
              borderColor: colors.backgroundSelected,
            },
          ]}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[
                  styles.filterPill,
                  isActive && { backgroundColor: colors.backgroundSelected },
                ]}
              >
                <ThemedText
                  style={[
                    styles.filterText,
                    { color: isActive ? colors.text : colors.textSecondary },
                  ]}
                >
                  {tab}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.tint}
            />
          }
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: BottomTabInset + Spacing.four },
          ]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View
              style={[
                styles.postCard,
                {
                  backgroundColor: colors.backgroundElement,
                  borderColor: colors.backgroundSelected,
                },
              ]}
            >
              <View style={styles.postHeader}>
                <View
                  style={[
                    styles.avatar,
                    {
                      backgroundColor: colors.backgroundSelected,
                      borderColor: colors.backgroundSelected,
                    },
                  ]}
                >
                  <ThemedText style={styles.avatarText}>
                    {item.author.charAt(0).toUpperCase()}
                  </ThemedText>
                </View>

                <View style={styles.authorMeta}>
                  <ThemedText style={styles.authorName}>
                    {item.author}
                  </ThemedText>
                  <View style={styles.badgeRow}>
                    <View
                      style={[
                        styles.deptBadge,
                        { backgroundColor: isDark ? '#143222' : '#DCFCE7' },
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.deptBadgeText,
                          { color: isDark ? '#4ADE80' : '#15803D' },
                        ]}
                      >
                        {item.department}
                      </ThemedText>
                    </View>

                    <View
                      style={[
                        styles.uniBadge,
                        { backgroundColor: colors.backgroundSelected },
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.uniBadgeText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {item.university}
                      </ThemedText>
                    </View>
                  </View>
                </View>

                <ThemedText
                  style={[styles.timestamp, { color: colors.textSecondary }]}
                >
                  {item.timestamp}
                </ThemedText>
              </View>

              <ThemedText style={styles.postBody}>{item.content}</ThemedText>

              <View
                style={[
                  styles.divider,
                  { backgroundColor: colors.backgroundSelected },
                ]}
              />

              <View style={styles.actionsRow}>
                <Pressable
                  onPress={() => toggleLike(item.id)}
                  style={styles.actionBtn}
                  hitSlop={8}
                >
                  <Ionicons
                    name={item.liked ? 'heart' : 'heart-outline'}
                    size={17}
                    color={item.liked ? colors.tint : colors.textSecondary}
                  />
                  <ThemedText
                    style={[
                      styles.actionText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {item.likes} {item.likes === 1 ? 'Like' : 'Likes'}
                  </ThemedText>
                </Pressable>

                <Pressable style={styles.actionBtn} hitSlop={8}>
                  <Ionicons
                    name="chatbubble-outline"
                    size={16}
                    color={colors.textSecondary}
                  />
                  <ThemedText
                    style={[
                      styles.actionText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {item.comments}{' '}
                    {item.comments === 1 ? 'Comment' : 'Comments'}
                  </ThemedText>
                </Pressable>

                <Pressable
                  onPress={() => handleShare(item)}
                  style={styles.actionBtn}
                  hitSlop={8}
                >
                  <Ionicons
                    name="share-outline"
                    size={17}
                    color={colors.textSecondary}
                  />
                  <ThemedText
                    style={[
                      styles.actionText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Share
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          )}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
  },
  topRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '700',
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 999,
    marginHorizontal: Spacing.three,
    marginBottom: 14,
    padding: 5,
  },
  filterPill: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 999,
    alignItems: 'center',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: Spacing.three,
    gap: 14,
  },
  postCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  authorMeta: {
    flex: 1,
  },
  authorName: {
    fontSize: 15.5,
    fontWeight: '700',
    marginBottom: Spacing.one,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deptBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: 999,
  },
  deptBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  uniBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: 999,
  },
  uniBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 11.5,
  },
  postBody: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: Spacing.three,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.one,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
