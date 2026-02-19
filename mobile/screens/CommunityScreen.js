import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, TextInput,
    TouchableOpacity, KeyboardAvoidingView, Platform, Animated
} from 'react-native';
import { ShieldCheck, ThumbsUp, MapPin, Send, AlertTriangle } from 'lucide-react-native';

const INITIAL_POSTS = [
    {
        id: '1',
        user: 'Dr. Meena Sharma',
        role: 'doctor',
        ward: 'CMO · Ward 12',
        content: 'Advisory: Boil drinking water for min 20 min. We are tracking a gastroenteritis cluster in Block C. Avoid raw vegetables.',
        time: '1h ago',
        upvotes: 218,
        verified: true,
        color: '#009688',
    },
    {
        id: '2',
        user: 'MCD Ward Officer',
        role: 'govt',
        ward: 'Municipal Corp. Delhi',
        content: 'Fogging drive scheduled for Lane 4, 6 & 7 tomorrow 6–9 AM. Please keep doors/windows open during drive.',
        time: '2h ago',
        upvotes: 134,
        verified: true,
        color: '#2980B9',
    },
    {
        id: '3',
        user: 'Ravi Kumar',
        role: 'citizen',
        ward: 'Block D, Lane 3',
        content: 'Huge open drain overflow near primary school. 5 families in my lane have fever since 2 days.',
        time: '15m ago',
        upvotes: 41,
        verified: false,
        color: '#E74C3C',
    },
    {
        id: '4',
        user: 'Priya Deshpande',
        role: 'citizen',
        ward: 'Market Area',
        content: 'Water supply is yellow today near the market. Did anyone else notice? Reported to DJB already.',
        time: '32m ago',
        upvotes: 27,
        verified: false,
        color: '#E67E22',
    },
    {
        id: '5',
        user: 'Anonymous',
        role: 'citizen',
        ward: 'Block A',
        content: 'Same issue here with water. 3 people in my building have diarrhea since yesterday.',
        time: '45m ago',
        upvotes: 19,
        verified: false,
        color: '#95A5A6',
    },
];

const ROLE_LABEL = { doctor: '👨‍⚕️ Doctor', govt: '🏛️ Govt Official', citizen: '👤 Citizen' };

const CommunityScreen = () => {
    const [posts, setPosts] = useState(INITIAL_POSTS);
    const [text, setText] = useState('');
    const [likedIds, setLikedIds] = useState(new Set());

    const handlePost = () => {
        if (!text.trim()) return;
        const newPost = {
            id: Date.now().toString(),
            user: 'You',
            role: 'citizen',
            ward: 'Ward 12',
            content: text,
            time: 'Just now',
            upvotes: 0,
            verified: false,
            color: '#009688',
        };
        setPosts([newPost, ...posts]);
        setText('');
    };

    const toggleLike = (id) => {
        setLikedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) { next.delete(id); setPosts(p => p.map(x => x.id === id ? { ...x, upvotes: x.upvotes - 1 } : x)); }
            else { next.add(id); setPosts(p => p.map(x => x.id === id ? { ...x, upvotes: x.upvotes + 1 } : x)); }
            return next;
        });
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Ward-12 Community Pulse</Text>
                <Text style={styles.headerSub}>Live feed · {posts.length} updates</Text>
            </View>

            {/* Alert Banner */}
            <View style={styles.banner}>
                <AlertTriangle size={16} color="#E74C3C" />
                <Text style={styles.bannerText}>HIGH RISK area · 3 verified health advisories active</Text>
            </View>

            <FlatList
                data={posts}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: 16, gap: 12 }}
                renderItem={({ item }) => (
                    <View style={[styles.card, item.verified && { borderLeftWidth: 4, borderLeftColor: item.color }]}>
                        {/* Author */}
                        <View style={styles.row}>
                            <View style={[styles.avatar, { backgroundColor: item.color + '22' }]}>
                                <Text style={{ fontWeight: 'bold', color: item.color }}>{item.user[0]}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <View style={styles.row}>
                                    <Text style={styles.username}>{item.user}</Text>
                                    {item.verified && <ShieldCheck size={14} color={item.color} />}
                                </View>
                                <Text style={styles.meta}>{ROLE_LABEL[item.role]} · {item.ward} · {item.time}</Text>
                            </View>
                        </View>

                        {/* Content */}
                        <Text style={styles.content}>{item.content}</Text>

                        {/* Actions */}
                        <View style={styles.row}>
                            <TouchableOpacity style={styles.likeBtn} onPress={() => toggleLike(item.id)}>
                                <ThumbsUp size={15} color={likedIds.has(item.id) ? '#009688' : '#999'} />
                                <Text style={[styles.likeText, likedIds.has(item.id) && { color: '#009688' }]}>
                                    {item.upvotes} Same here
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.locBtn}>
                                <MapPin size={14} color="#999" />
                                <Text style={styles.locText}>Map</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            />

            {/* Input */}
            <View style={styles.inputRow}>
                <TextInput
                    style={styles.input}
                    placeholder="Share a safety update anonymously..."
                    value={text}
                    onChangeText={setText}
                    multiline
                />
                <TouchableOpacity style={styles.sendBtn} onPress={handlePost}>
                    <Send size={20} color="#FFF" />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0F2F5' },
    header: { paddingTop: 55, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: '#009688' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
    headerSub: { color: '#E0F2F1', fontSize: 12, marginTop: 2 },
    banner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FDEDEC', paddingHorizontal: 16, paddingVertical: 10 },
    bannerText: { color: '#C0392B', fontSize: 13, fontWeight: '600' },
    card: { backgroundColor: '#FFF', borderRadius: 14, padding: 16, elevation: 2 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    avatar: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
    username: { fontWeight: 'bold', color: '#222', fontSize: 14 },
    meta: { fontSize: 11, color: '#999' },
    content: { fontSize: 14, color: '#444', lineHeight: 21, marginVertical: 10 },
    likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4, paddingHorizontal: 10, backgroundColor: '#F5F5F5', borderRadius: 20 },
    likeText: { fontSize: 13, color: '#999' },
    locBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 10 },
    locText: { fontSize: 12, color: '#999' },
    inputRow: { flexDirection: 'row', padding: 12, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#EEE', alignItems: 'flex-end', gap: 10 },
    input: { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, maxHeight: 80, fontSize: 14 },
    sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#009688', justifyContent: 'center', alignItems: 'center' },
});

export default CommunityScreen;
