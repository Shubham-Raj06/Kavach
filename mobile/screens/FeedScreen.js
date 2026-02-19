import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useAuthStore from '../store/authStore';
import useFeedStore from '../store/feedStore';
import PostCard from '../components/PostCard';

export default function FeedScreen() {
    const insets = useSafeAreaInsets();
    const { user, isDemo } = useAuthStore();
    const { posts, fetchFeed, createPost, toggleLike, isLoading, hasMore } = useFeedStore();
    const [content, setContent] = useState('');
    const [posting, setPosting] = useState(false);
    const [composerOpen, setComposerOpen] = useState(false);
    const [postError, setPostError] = useState('');

    useFocusEffect(useCallback(() => {
        if (user?.wardId) fetchFeed(user.wardId, true);
    }, [user?.wardId]));

    const handlePost = async () => {
        if (!content.trim()) return;
        // Fix P2: demo guard — show friendly message instead of 401
        if (isDemo) {
            setPostError('Connect to a live backend to post in the community feed.');
            return;
        }
        setPosting(true);
        setPostError('');
        try {
            await createPost(content.trim());
            setContent('');
            setComposerOpen(false);
        } catch (e) {
            setPostError(e.message);
        } finally {
            setPosting(false);
        }
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <Text style={styles.title}>Community Feed</Text>
                <Text style={styles.sub}>Ward {user?.wardId}</Text>
                <TouchableOpacity style={styles.composeBtn} onPress={() => { setComposerOpen(o => !o); setPostError(''); }}>
                    <Ionicons name="create-outline" size={20} color="#00D4FF" />
                </TouchableOpacity>
            </View>

            {/* Composer */}
            {composerOpen && (
                <View style={styles.composer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Share a health update with your ward…"
                        placeholderTextColor="#444"
                        value={content}
                        onChangeText={setContent}
                        multiline
                        maxLength={280}
                        autoFocus
                    />
                    {!!postError && <Text style={styles.postErr}>{postError}</Text>}
                    <View style={styles.composerFooter}>
                        <Text style={styles.charCount}>{280 - content.length}</Text>
                        <TouchableOpacity style={styles.postBtn} onPress={handlePost} disabled={posting}>
                            <Text style={styles.postBtnText}>{posting ? '...' : 'Post'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            <FlatList
                data={posts}
                keyExtractor={(item, i) => item._id || item.id || String(i)}
                renderItem={({ item }) => (
                    <PostCard
                        post={item}
                        onLike={(id) => toggleLike(id, user?.id)}
                        currentUserId={user?.id}
                    />
                )}
                contentContainerStyle={styles.list}
                onEndReached={() => hasMore && user?.wardId && fetchFeed(user.wardId)}
                onEndReachedThreshold={0.3}
                onRefresh={() => user?.wardId && fetchFeed(user.wardId, true)}
                refreshing={isLoading}
                ListEmptyComponent={
                    !isLoading && (
                        <View style={styles.empty}>
                            <Text style={styles.emptyIcon}>📭</Text>
                            <Text style={styles.emptyText}>No posts yet. Be the first!</Text>
                        </View>
                    )
                }
            />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A0F' },
    header: { paddingHorizontal: 20, paddingBottom: 14, flexDirection: 'row', alignItems: 'center' },
    title: { color: '#FFF', fontSize: 22, fontWeight: '800', flex: 1 },
    sub: { color: '#555', fontSize: 13, marginRight: 12 },
    composeBtn: { padding: 8 },
    composer: { backgroundColor: '#13131A', margin: 16, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#2A2A3A' },
    input: { color: '#FFF', fontSize: 15, minHeight: 70, textAlignVertical: 'top' },
    postErr: { color: '#FF6B6B', fontSize: 12, marginTop: 6 },
    composerFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    charCount: { color: '#444', fontSize: 12 },
    postBtn: { backgroundColor: '#00D4FF', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
    postBtnText: { color: '#000', fontWeight: '700', fontSize: 14 },
    list: { padding: 16, paddingTop: 8, paddingBottom: 30 },
    empty: { alignItems: 'center', paddingTop: 60 },
    emptyIcon: { fontSize: 48 },
    emptyText: { color: '#444', marginTop: 12, fontSize: 15 },
});
