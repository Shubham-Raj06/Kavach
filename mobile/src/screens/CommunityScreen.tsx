import React, { useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TextInput,
    TouchableOpacity, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius } from '../constants/theme';

const POSTS = [
    {
        id: '1',
        user: 'Dr. Meena Sharma',
        role: 'doctor',
        ward: 'CMO · Ward 12',
        content: 'Advisory: Boil water for 20 min before drinking. We are tracking a gastroenteritis cluster in Block C. Avoid raw vegetables until further notice.',
        time: '1h ago',
        upvotes: 218,
        verified: true,
        accent: colors.green,
    },
    {
        id: '2',
        user: 'MCD Ward Officer',
        role: 'govt',
        ward: 'Municipal Corp. Delhi',
        content: 'Fogging drive scheduled tomorrow 6–9 AM in Lanes 4, 6 & 7. Keep doors and windows open during the drive for best effect.',
        time: '2h ago',
        upvotes: 134,
        verified: true,
        accent: colors.accent,
    },
    {
        id: '3',
        user: 'Ravi Kumar',
        role: 'citizen',
        ward: 'Block D, Lane 3',
        content: 'Huge open drain overflow near primary school. 5 families in my lane reporting fever since 2 days. Someone report this to MCD!',
        time: '15m ago',
        upvotes: 41,
        verified: false,
        accent: colors.red,
    },
    {
        id: '4',
        user: 'Priya D.',
        role: 'citizen',
        ward: 'Market Area',
        content: 'Water supply is yellowish near the market today. Already reported to DJB (1916). Did anyone else notice this?',
        time: '32m ago',
        upvotes: 27,
        verified: false,
        accent: colors.orange,
    },
    {
        id: '5',
        user: 'Anonymous',
        role: 'citizen',
        ward: 'Block A',
        content: '3 people in my building have diarrhea since yesterday. The water smells strange. Please investigate.',
        time: '45m ago',
        upvotes: 19,
        verified: false,
        accent: colors.textMuted as string,
    },
];

const ROLE_ICON: Record<string, string> = {
    doctor: '👨‍⚕️',
    govt: '🏛️',
    citizen: '👤',
};

export default function CommunityScreen() {
    const [posts, setPosts] = useState(POSTS);
    const [text, setText] = useState('');
    const [liked, setLiked] = useState<Set<string>>(new Set());

    const handlePost = () => {
        if (!text.trim()) return;
        setPosts([{
            id: Date.now().toString(),
            user: 'You',
            role: 'citizen',
            ward: 'Ward 12',
            content: text,
            time: 'Just now',
            upvotes: 0,
            verified: false,
            accent: colors.green,
        }, ...posts]);
        setText('');
    };

    const toggleLike = (id: string) => {
        setLiked(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
                setPosts(p => p.map(x => x.id === id ? { ...x, upvotes: x.upvotes - 1 } : x));
            } else {
                next.add(id);
                setPosts(p => p.map(x => x.id === id ? { ...x, upvotes: x.upvotes + 1 } : x));
            }
            return next;
        });
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
            <SafeAreaView style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>💬 Ward-12 Pulse</Text>
                    <Text style={styles.headerSub}>Community · {posts.length} updates live</Text>
                </View>

                {/* Alert Banner */}
                <View style={styles.banner}>
                    <Text style={styles.bannerText}>🔴 HIGH RISK · 3 verified health advisories active</Text>
                </View>

                <FlatList
                    data={posts}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ padding: spacing.lg, gap: 12 }}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <View style={[styles.card, item.verified && { borderLeftWidth: 3, borderLeftColor: item.accent }]}>
                            <View style={styles.cardTop}>
                                <View style={[styles.avatar, { backgroundColor: item.accent + '22' }]}>
                                    <Text>{ROLE_ICON[item.role]}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <View style={styles.nameRow}>
                                        <Text style={styles.name}>{item.user}</Text>
                                        {item.verified && <Text style={[styles.verifiedTag, { backgroundColor: item.accent + '22', color: item.accent }]}>✓ Verified</Text>}
                                    </View>
                                    <Text style={styles.meta}>{item.ward} · {item.time}</Text>
                                </View>
                            </View>
                            <Text style={styles.content}>{item.content}</Text>
                            <TouchableOpacity style={styles.likeRow} onPress={() => toggleLike(item.id)}>
                                <Text style={[styles.likeText, liked.has(item.id) && { color: colors.accent }]}>
                                    👍 {item.upvotes} Same here
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                />

                <View style={styles.inputArea}>
                    <TextInput
                        style={styles.input}
                        placeholder="Share a safety update anonymously..."
                        placeholderTextColor={colors.textDim}
                        value={text}
                        onChangeText={setText}
                        multiline
                    />
                    <TouchableOpacity style={styles.sendBtn} onPress={handlePost}>
                        <Text style={styles.sendText}>Send</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
    headerTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
    headerSub: { fontSize: 12, color: colors.textDim, marginTop: 2 },
    banner: { backgroundColor: colors.redGlow, paddingHorizontal: spacing.lg, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
    bannerText: { color: colors.red, fontSize: 13, fontWeight: '600' },
    card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
    cardTop: { flexDirection: 'row', gap: 12, marginBottom: 10 },
    avatar: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    name: { fontWeight: '600', color: colors.text, fontSize: 14 },
    verifiedTag: { fontSize: 10, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, fontWeight: '600' },
    meta: { fontSize: 11, color: colors.textDim, marginTop: 2 },
    content: { fontSize: 14, color: colors.textMuted, lineHeight: 21 },
    likeRow: { marginTop: 10 },
    likeText: { fontSize: 13, color: colors.textDim },
    inputArea: { flexDirection: 'row', padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, gap: 10, alignItems: 'flex-end' },
    input: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.full, paddingHorizontal: spacing.lg, paddingVertical: 10, maxHeight: 80, fontSize: 14, color: colors.text, borderWidth: 1, borderColor: colors.border },
    sendBtn: { backgroundColor: colors.accent, borderRadius: radius.full, paddingHorizontal: 20, paddingVertical: 10 },
    sendText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
