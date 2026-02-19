import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RiskBadge from './RiskBadge';

export default function PostCard({ post, onLike, currentUserId }) {
    const liked = post.likes?.includes(currentUserId);
    const timeAgo = (date) => {
        const diff = Math.floor((Date.now() - new Date(date)) / 1000);
        if (diff < 60) return `${diff}s`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
        return `${Math.floor(diff / 86400)}d`;
    };

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{post.userId?.name?.[0]?.toUpperCase() || '?'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{post.userId?.name || 'Unknown'}</Text>
                    <Text style={styles.meta}>Ward {post.ward} · {timeAgo(post.createdAt)}</Text>
                </View>
                <RiskBadge level={post.userId?.role === 'hospital' ? 'HIGH' : 'LOW'} size="sm" />
            </View>
            <Text style={styles.content}>{post.content}</Text>
            <View style={styles.footer}>
                <TouchableOpacity style={styles.likeBtn} onPress={() => onLike?.(post._id)}>
                    <Ionicons name={liked ? 'heart' : 'heart-outline'} size={18} color={liked ? '#FF453A' : '#666'} />
                    <Text style={[styles.likeCount, liked && { color: '#FF453A' }]}>{post.likes?.length || 0}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: { backgroundColor: '#13131A', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#1E1E2E' },
    header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#00D4FF22', justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: '#00D4FF', fontWeight: '700', fontSize: 15 },
    name: { color: '#FFF', fontWeight: '600', fontSize: 14 },
    meta: { color: '#555', fontSize: 11, marginTop: 1 },
    content: { color: '#CCC', fontSize: 14, lineHeight: 21 },
    footer: { flexDirection: 'row', marginTop: 12 },
    likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    likeCount: { color: '#666', fontSize: 13 },
});
