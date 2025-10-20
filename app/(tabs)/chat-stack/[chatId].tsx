import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    StyleSheet,
    Modal,
    Platform
} from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareFlatList } from 'react-native-keyboard-aware-scroll-view';
import { useAuthContext } from '../../../context/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

type BackendMessage = { _id: string; text: string; sender: string; createdAt: string; conversationId: string; };
type CachedMessage = BackendMessage & { status?: 'sending' | 'error' | 'sent' };
type UIMessage = {
    _id: string;
    text: string;
    sender: 'me' | 'other';
    timestamp: string;
    status: 'sending' | 'sent' | 'error';
};

const formatTime = (timestamp: string) =>
    timestamp ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

const mapSender = (senderId: string, myId?: string): 'me' | 'other' => senderId === myId ? 'me' : 'other';

export default function ChatScreen() {
    const params = useLocalSearchParams<{ chatId: string; receiverId: string; userName: string; userAvatar: string }>();
    const { chatId, receiverId, userName, userAvatar } = params;
    const { user } = useAuthContext();
    const queryClient = useQueryClient();

    const [inputText, setInputText] = useState('');
    const [isMenuVisible, setIsMenuVisible] = useState(false);
    const insets = useSafeAreaInsets();
    const socketRef = useRef<Socket | null>(null);

    // ------------------ SOCKET.IO ------------------
    useEffect(() => {
        if (!user?.token) return;
        const socket = io(API_BASE_URL!, { auth: { token: user.token } });
        socketRef.current = socket;
        socket.on('connect', () => console.log('✅ Connected'));
        socket.on('disconnect', () => console.log('🔴 Disconnected'));
        return () => { socket.disconnect(); };
    }, [user?.token]);

    // ------------------ FETCH PORUKA ------------------
    const { data: uiMessages = [], isLoading: isChatLoading } = useQuery({
        queryKey: ['chat', chatId],
        queryFn: async (): Promise<CachedMessage[]> => {
            if (!chatId || !user?.token) return [];
            const response = await axios.get(`${API_BASE_URL}/api/user/chat/${chatId}/messages`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            return response.data || [];
        },
        enabled: !!chatId && !!user?.token,
        select: (data: CachedMessage[]): UIMessage[] => {
            return data
                .map(msg => ({
                    _id: msg._id,
                    text: msg.text,
                    timestamp: msg.createdAt,
                    sender: mapSender(msg.sender, user?.id),
                    status: msg.status || 'sent'
                }))
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        }
    });

    // ------------------ SLANJE PORUKE ------------------
    const handleSend = () => {
        if (!inputText.trim() || !socketRef.current?.connected || !receiverId || !user?.id) return;
        const messageText = inputText.trim();
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        const optimisticMessage: CachedMessage = {
            _id: tempId, text: messageText, sender: user.id,
            createdAt: new Date().toISOString(), conversationId: chatId!, status: 'sending'
        };
        queryClient.setQueryData<CachedMessage[]>(['chat', chatId], (oldData) => {
            const messages = Array.isArray(oldData) ? oldData : [];
            return [optimisticMessage, ...messages];
        });
        socketRef.current.emit(
            'sendMessage',
            { receiverId, text: messageText },
            (response: { status: string; message: BackendMessage }) => {
                queryClient.setQueryData<CachedMessage[]>(['chat', chatId], (oldData) => {
                    const messages = Array.isArray(oldData) ? oldData : [];
                    return messages.map(msg =>
                        msg._id === tempId
                            ? { ...response.message, status: response.status === 'ok' ? 'sent' : 'error' }
                            : msg
                    );
                });
            }
        );
        setInputText('');
    };

    // ------------------ PRIMANJE PORUKA ------------------
    useEffect(() => {
        const socket = socketRef.current;
        if (!socket || !chatId || !user?.id) return;
        const handleReceiveMessage = (message: BackendMessage) => {
            if (message.conversationId !== chatId) return;
            queryClient.setQueryData<CachedMessage[]>(['chat', chatId], (oldData) => {
                const messages = Array.isArray(oldData) ? oldData : [];
                if (messages.find(msg => msg._id === message._id)) return messages;
                const index = messages.findIndex(msg => msg.status === 'sending' && msg.text === message.text);
                if (index !== -1) {
                    const newMessages = [...messages];
                    newMessages[index] = { ...message, status: 'sent' };
                    return newMessages;
                }
                return [message, ...messages];
            });
        };
        socket.on('receiveMessage', handleReceiveMessage);
        return () => { socket.off('receiveMessage', handleReceiveMessage); };
    }, [chatId, user?.id, queryClient]);

    // ------------------ RENDER PORUKA ------------------
    const renderMessage = ({ item }: { item: UIMessage }) => {
        const isMyMessage = item.sender === 'me';
        const StatusIcon = ({ status }: { status: UIMessage['status'] }) => {
            if (status === 'sent') return null;
            if (status === 'sending') return <ActivityIndicator size={12} color='rgba(255,255,255,0.8)' style={{ marginLeft: 5 }} />;
            if (status === 'error') return <Ionicons name="alert-circle" size={14} color="#FF3B30" style={{ marginLeft: 5 }} />;
            return null;
        };
        return (
            <View style={[styles.messageContainer, isMyMessage ? styles.myContainer : styles.otherContainer]}>
                <View style={[styles.messageBubble, isMyMessage ? styles.myMessage : styles.otherMessage]}>
                    <Text style={{ color: isMyMessage ? '#fff' : '#000' }}>{item.text}</Text>
                    <View style={styles.timeAndStatusWrapper}>
                        <Text style={isMyMessage ? styles.myTime : styles.otherTime}>{formatTime(item.timestamp)}</Text>
                        {isMyMessage && <StatusIcon status={item.status} />}
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.fullScreen}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={[styles.customHeader, { paddingTop: insets.top }]}>
                <TouchableOpacity onPress={() => router.replace('/(tabs)/chat-stack')} style={styles.headerButton}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <View style={styles.headerCenterContent}>
                    <Image source={{ uri: userAvatar || 'https://placekitten.com/34/34' }} style={styles.headerAvatar} />
                    <Text style={styles.headerName} numberOfLines={1}>{userName || 'Korisnik'}</Text>
                </View>
                <View style={styles.headerRightButtons}>
                    <TouchableOpacity style={styles.headerButton}><Ionicons name="videocam-outline" size={24} color="#000" /></TouchableOpacity>
                    <TouchableOpacity onPress={() => setIsMenuVisible(true)} style={styles.headerButton}><Ionicons name="ellipsis-horizontal" size={24} color="#000" /></TouchableOpacity>
                </View>
            </View>

            {isChatLoading ? (
                <View style={styles.loaderContainer}><ActivityIndicator size="large" color="#FF6A00" /></View>
            ) : (
                <KeyboardAwareFlatList
                    data={uiMessages}
                    keyExtractor={item => item._id}
                    renderItem={renderMessage}
                    inverted
                    style={{ flex: 1 }}
                    contentContainerStyle={{ padding: 10 }}
                />
            )}

            <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 10 }]}>
                <TextInput
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder="Pošalji poruku..."
                    style={styles.input}
                    multiline
                />
                <TouchableOpacity onPress={handleSend} style={styles.sendButton} disabled={!inputText.trim()}>
                    <Ionicons name="send" size={22} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* ------------------ Tvoj Modal ------------------ */}
            <Modal
                visible={isMenuVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsMenuVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setIsMenuVisible(false)}
                >
                    <View style={styles.actionSheetWrapper}>
                        <View style={styles.actionSheetGroup}>
                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={async () => {
                                    setIsMenuVisible(false);
                                    if (!user?.token || !chatId) return;
                                    try {
                                        await axios.delete(`${API_BASE_URL}/api/user/match/${chatId}`, {
                                            headers: { Authorization: `Bearer ${user.token}` },
                                        });
                                        queryClient.invalidateQueries({ queryKey: ['my-matches', user.id] });
                                        router.replace('/(tabs)/chat-stack');
                                    } catch (err) {
                                        console.error("Greška pri brisanju korisnika:", err);
                                    }
                                }}
                            >
                                <Text style={styles.menuTextDestructive}>Prekini spoj sa {userName}</Text>
                            </TouchableOpacity>

                            <View style={styles.separator} />

                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => {
                                    setIsMenuVisible(false);
                                    alert(`Prijavljujem korisnika: ${userName}`);
                                }}
                            >
                                <Text style={styles.menuText}>Prijavi korisnika {userName}</Text>
                            </TouchableOpacity>

                            <View style={styles.separator} />

                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => {
                                    setIsMenuVisible(false);
                                    alert(`Blokiram korisnika: ${userName}`);
                                }}
                            >
                                <Text style={styles.menuTextDestructive}>Blokiraj korisnika</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setIsMenuVisible(false)}
                        >
                            <Text style={styles.cancelText}>Otkaži</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    fullScreen: { flex: 1, backgroundColor: '#fff' },
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    customHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 60,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingHorizontal: 10,
    },
    headerButton: { padding: 5 },
    headerCenterContent: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 10 },
    headerName: { fontSize: 18, fontWeight: '600', flexShrink: 1 },
    headerRightButtons: { flexDirection: 'row', alignItems: 'center' },
    headerAvatar: { width: 34, height: 34, borderRadius: 17, marginRight: 10 },

    messageContainer: { marginVertical: 5, paddingHorizontal: 10 },
    myContainer: { alignSelf: 'flex-end' },
    otherContainer: { alignSelf: 'flex-start' },
    messageBubble: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, maxWidth: '80%' },
    myMessage: { backgroundColor: '#FF6A00' },
    otherMessage: { backgroundColor: '#E5E5EA' },
    timeAndStatusWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 3 },
    myTime: { color: 'rgba(255, 255, 255, 0.7)', fontSize: 10 },
    otherTime: { color: '#666', fontSize: 10 },

    inputContainer: { flexDirection: 'row', paddingHorizontal: 8, paddingTop: 8, borderTopColor: '#ddd', borderTopWidth: 1, alignItems: 'center', backgroundColor: '#fff' },
    input: { flex: 1, paddingVertical: 10, paddingHorizontal: 15, backgroundColor: '#f2f2f2', borderRadius: 20, marginRight: 8, maxHeight: 100 },
    sendButton: { backgroundColor: '#FF6A00', borderRadius: 20, width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', paddingHorizontal: 10, paddingBottom: Platform.OS === 'ios' ? 40 : 20 },
    actionSheetWrapper: { width: '100%' },
    actionSheetGroup: { backgroundColor: 'white', borderRadius: 12, overflow: 'hidden', marginBottom: 10 },
    menuItem: { paddingHorizontal: 20, paddingVertical: 16, backgroundColor: 'white', alignItems: 'center' },
    menuText: { fontSize: 16, color: '#333', textAlign: 'center' },
    menuTextDestructive: { fontSize: 16, color: '#FF3B30', fontWeight: '600', textAlign: 'center' },
    separator: { height: 1, backgroundColor: '#E0E0E0' },
    cancelButton: { paddingHorizontal: 20, paddingVertical: 16, backgroundColor: 'white', borderRadius: 12, marginTop: 10, alignItems: 'center' },
    cancelText: { fontSize: 16, color: '#007AFF', fontWeight: '600', textAlign: 'center' },
});
