import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    StyleSheet,
    Platform,
    Modal, 
} from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 
import { KeyboardAwareFlatList } from 'react-native-keyboard-aware-scroll-view'; 

import { useAuthContext } from '../../../context/AuthContext'; 
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; 
import axios from 'axios'; 

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

type BackendMessage = {
    _id: string;
    text: string;
    senderId: string;
    timestamp: string;
};

type UIMessage = {
    id: string;
    text: string;
    sender: 'me' | 'other';
    timestamp: string;
    status?: 'sending' | 'sent' | 'error'; 
};

const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// ---------------- GLAVNA KOMPONENTA ----------------
export default function ChatScreen() {
    const params = useLocalSearchParams<{
        chatId: string;
        userName: string;
        userAvatar: string;
    }>();

    const { chatId: initialChatId, userName, userAvatar } = params;

    const { user } = useAuthContext(); 
    const queryClient = useQueryClient();
    
    const [currentChatId, setCurrentChatId] = useState(initialChatId || ''); 
    const [isMenuVisible, setIsMenuVisible] = useState(false); 
    
    const [isNavigatingBack, setIsNavigatingBack] = useState(false); 

    const [inputText, setInputText] = useState('');
    
    const insets = useSafeAreaInsets();
    const flatListRef = useRef<KeyboardAwareFlatList>(null); 
    const inputRef = useRef<TextInput>(null); 


    // ---------------- PRIPREMA STANJA ----------------
    useEffect(() => {
        if (initialChatId) {
            setCurrentChatId(initialChatId);
        }
    }, [initialChatId, userAvatar, userName]);


    // ---------------- FETCH MESSAGES ----------------
    const { data, isLoading: isChatLoading, error, refetch } = useQuery({
        queryKey: ['chat', currentChatId],
        queryFn: async () => {
            if (!currentChatId || !user?.token) return { messages: [] };
            const response = await axios.get(`${API_BASE_URL}/api/user/chat/${currentChatId}/messages`, {
                headers: { Authorization: `Bearer ${user.token}` },
            });
            return response.data;
        },
        enabled: !!currentChatId && !!user?.token,
    });

    const messages: UIMessage[] = (data?.messages || []).map((msg: BackendMessage) => ({
        id: String(msg._id),
        text: msg.text,
        timestamp: msg.timestamp,
        sender: String(msg.senderId) === String(user?.id) ? 'me' : 'other', 
        status: 'sent' as const, 
    }));
    
    messages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // ---------------- SCROLL LOGIKA ----------------
    const scrollToEndSafe = () => {
        if (flatListRef.current) {
            (flatListRef.current as any).scrollToEnd({ animated: true }); 
        }
    };
    
    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(scrollToEndSafe, 100);
        }
    }, [messages.length, isChatLoading]); 


    // ---------------- SLANJE PORUKE (MUTACIJA) ----------------
    const { mutate: sendMessage, isPending: isSending } = useMutation({
        mutationFn: async (messageText: string) => {
            const response = await axios.post(
                `${API_BASE_URL}/api/user/chat/${currentChatId}/message`, 
                { text: messageText },
                { headers: { Authorization: `Bearer ${user!.token}` } }
            );
            return response.data;
        },
        onMutate: async (messageText: string) => {
            const tempId = Date.now().toString();
            
            // ✅ KRITIČNO: Odloženi fokus za borbu protiv nativnog gubitka
            if (inputRef.current) {
                setTimeout(() => {
                    inputRef.current?.focus();
                }, 1); 
            }

            await queryClient.cancelQueries({ queryKey: ['chat', currentChatId] });
            const previousChatData = queryClient.getQueryData(['chat', currentChatId]);
            
            queryClient.setQueryData(['chat', currentChatId], (old: any) => ({
                ...old,
                messages: [{ 
                    _id: tempId, 
                    text: messageText, 
                    senderId: user!.id, 
                    createdAt: new Date().toISOString(),
                    status: 'sending' as const,
                }, ...(old?.messages || [])], 
            }));
            
            setTimeout(scrollToEndSafe, 50);

            return { previousChatData, tempId };
        },
        onError: (err, newText, context) => {
            console.error("LOG SEND ERROR: Poruka nije poslata. Status: error", err);
            
            queryClient.setQueryData(['chat', currentChatId], (old: any) => ({
                 ...old,
                 messages: old.messages.map((msg: any) => 
                     msg._id === context?.tempId ? { ...msg, status: 'error' as const } : msg
                 )
            }));
        },
        onSuccess: (data, variables, context) => {
            const newConversationId = data.conversationId;
            
            queryClient.setQueryData(['chat', currentChatId], (old: any) => ({
                ...old,
                messages: old.messages.map((msg: any) => 
                     msg._id === context?.tempId ? { ...data, status: 'sent' as const } : msg
                )
            }));
            
            if (newConversationId && newConversationId !== currentChatId) {
                setCurrentChatId(newConversationId); 
                
                const newParams = { chatId: newConversationId, userName: userName, userAvatar: userAvatar };
                router.replace({ pathname: `/chat-stack/[chatId]`, params: newParams });
            }
            
            queryClient.invalidateQueries({ queryKey: ['chat', newConversationId || currentChatId] });
            queryClient.invalidateQueries({ queryKey: ['my-matches', user!.id] });
        },
    });

    const handleSend = () => {
        if (!currentChatId || !user?.token || !inputText.trim()) {
            console.error("LOG HANDLE SEND: Neuspeh - Nedostaje ID, tekst, ili token.");
            alert("Greška: ID razgovora nije pronađen. Probajte se vratiti i ponovo ući u chat.");
            return;
        }
        const messageText = inputText.trim();
        setInputText(''); // Reset ovde
        sendMessage(messageText);
    };
    
    // ---------------- NAVIGACIJA I UNMATCH LOGIKA ----------------
    const handleMenuPress = () => { setIsMenuVisible(true); };
    const handleCloseMenu = () => { setIsMenuVisible(false); };
    
    const handleReport = () => { handleCloseMenu(); alert(`Prijavljujem korisnika: ${userName}`); };
    const handleBlock = () => { handleCloseMenu(); alert(`Blokiram korisnika: ${userName}`); };
    
    const handleGoBack = () => { 
        setIsNavigatingBack(true);
        setTimeout(() => {
             router.replace('/(tabs)/chat-stack'); 
        }, 50); 
    };
    
    const handleUnmatch = async () => {
        handleCloseMenu();
        if (!user?.token || !currentChatId) return; 
        try {
            await axios.delete(`${API_BASE_URL}/api/user/match/${currentChatId}`, { 
                headers: { Authorization: `Bearer ${user.token}` },
            });
            queryClient.invalidateQueries({ queryKey: ['my-matches', user.id] });
            router.replace('/(tabs)/chat-stack'); 
        } catch (error) {
             // ... (rukovanje greškama)
        }
    };

    const renderMessage = ({ item }: { item: UIMessage }) => {
        const isMyMessage = item.sender === 'me';
        
        const StatusIcon = ({ status }: { status: UIMessage['status'] }) => {
            if (!status || status === 'sent') return null;
            
            switch (status) {
                case 'sending':
                    return <ActivityIndicator size={12} color={isMyMessage ? 'rgba(255, 255, 255, 0.8)' : '#666'} style={{ marginLeft: 5 }} />;
                case 'error':
                    return <Ionicons name="alert-circle" size={14} color="#FF3B30" style={{ marginLeft: 5 }} />;
                default:
                    return null;
            }
        };

        return (
            <View style={[styles.messageContainer, isMyMessage ? styles.myContainer : styles.otherContainer]}>
                <View
                    key={item.id}
                    style={[
                        styles.messageBubble,
                        isMyMessage ? styles.myMessage : styles.otherMessage,
                    ]}
                >
                    <Text style={{ color: isMyMessage ? '#fff' : '#000' }}>{item.text}</Text>
                    
                    <View style={styles.timeAndStatusWrapper}>
                        <Text style={isMyMessage ? styles.myTime : styles.otherTime}>
                            {formatTime(item.timestamp)}
                        </Text>
                        {isMyMessage && <StatusIcon status={item.status} />}
                    </View>

                </View>
            </View>
        );
    };

    return (
        <View style={styles.fullScreen}> 
            <Stack.Screen
                options={{ headerShown: false }}
            />

            {/* CUSTOM HEADER */}
            <View style={[styles.customHeader, { paddingTop: insets.top }]}>
                
                <TouchableOpacity onPress={handleGoBack} style={styles.headerButton}>
                    <Ionicons name="arrow-back" size={24} color="#000" /> 
                </TouchableOpacity>

                <View style={styles.headerCenterContent}>
                    <Image
                        source={{ uri: userAvatar || 'https://placekitten.com/34/34' }}
                        style={styles.headerAvatar}
                    />
                    <Text style={styles.headerName}>{userName || 'Korisnik'}</Text>
                </View>

                <View style={styles.headerRightButtons}>
                    <TouchableOpacity onPress={() => console.log('Video kamera pritisnuta')} style={styles.headerButton}>
                        <Ionicons name="videocam-outline" size={24} color="#000" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleMenuPress} style={styles.headerButton}>
                        <Ionicons name="ellipsis-horizontal" size={24} color="#000" /> 
                    </TouchableOpacity>
                </View>
            </View>
            
            {/* OSTATAK KOMPONENTE */}
            {isChatLoading && (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#FF6A00" />
                </View>
            )}

            {error && !isChatLoading && (
                <View style={styles.loaderContainer}>
                    <Text style={{ color: 'red' }}>Greška pri učitavanju poruka: {error instanceof Error ? error.message : "Nepoznata greška"}</Text>
                    <TouchableOpacity onPress={() => refetch()} style={{ marginTop: 10 }}>
                        <Text style={{ color: '#007AFF' }}>Pokušaj ponovo</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* KOMPONENTA ZA PRIKAZ PORUKA */}
            {!isChatLoading && !error && (
                <KeyboardAwareFlatList 
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={renderMessage}
                    contentContainerStyle={{ padding: 10, paddingBottom: 20 }}
                    style={{ flex: 1 }}
                    extraScrollHeight={Platform.OS === 'android' ? 150 : 40} 
                    keyboardShouldPersistTaps="handled"
                    inverted={true} 
                />
            )}

            {/* INPUT KONTEJNER */}
            <View style={[
                styles.inputContainer,
                { paddingBottom: insets.bottom +10} 
            ]}>
                <TextInput
                    ref={inputRef} 
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder="Pošalji poruku..."
                    style={styles.input}
                    placeholderTextColor="#999"
                    multiline
                    editable={!isSending}
                    blurOnSubmit={false} // KRITIČNO: Zadržava fokus
                />
                <TouchableOpacity 
                    onPress={handleSend} 
                    style={[styles.sendButton, { opacity: inputText.trim() && !isSending ? 1 : 0.5 }]}
                    disabled={!inputText.trim() || isSending}
                >
                    {isSending ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Ionicons name="send" size={22} color="#fff" />
                    )}
                </TouchableOpacity>
            </View>
            
            {/* MODAL KOMPONENTA */}
            <Modal
                visible={isMenuVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={handleCloseMenu} 
            >
                <TouchableOpacity 
                    style={styles.modalOverlay} 
                    activeOpacity={1}
                    onPress={handleCloseMenu} 
                >
                    <View style={styles.actionSheetWrapper}>
                        
                        <View style={styles.actionSheetGroup}>
                            <TouchableOpacity style={styles.menuItem} onPress={handleUnmatch}>
                                <Text style={styles.menuTextDestructive}>Prekini spoj sa {userName}</Text>
                            </TouchableOpacity>
                            
                            <View style={styles.separator} /> 

                            <TouchableOpacity style={styles.menuItem} onPress={handleReport}>
                                <Text style={styles.menuText}>Prijavi korisnika {userName}</Text>
                            </TouchableOpacity>

                            <View style={styles.separator} /> 

                            <TouchableOpacity style={styles.menuItemDestructive} onPress={handleBlock}>
                                <Text style={styles.menuTextDestructive}>Blokiraj korisnika</Text>
                            </TouchableOpacity>
                        </View>
                        
                        <TouchableOpacity style={styles.cancelButton} onPress={handleCloseMenu}>
                            <Text style={styles.cancelText}>Otkaži</Text>
                        </TouchableOpacity>

                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    fullScreen: { 
        flex: 1, 
        backgroundColor: '#fff',
        width: '100%', 
    }, 
    
    // CUSTOM HEADER STILOVI
    customHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 60, 
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingHorizontal: 0, 
        width: '100%', 
    },
    headerButton: {
        padding: 10, 
    },
    headerCenterContent: { 
        flex: 1, 
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start', 
        paddingLeft: 5, 
    },
    headerRightButtons: { 
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 10, 
    },
    headerAvatar: { 
        width: 34, 
        height: 34, 
        borderRadius: 17, 
        marginRight: 10, 
    }, 
    headerName: { 
        fontSize: 18, 
        fontWeight: '600',
        flexShrink: 1, 
    },
    
    // STILOVI ZA PORUKE I VREME
    messageContainer: {
        marginVertical: 5,
    },
    myContainer: {
        alignSelf: 'flex-end',
    },
    otherContainer: {
        alignSelf: 'flex-start',
    },
    messageBubble: { 
        paddingVertical: 8,
        paddingHorizontal: 12, 
        borderRadius: 20, 
        maxWidth: '75%',
        flexDirection: 'column', 
    },
    myMessage: { 
        alignSelf: 'flex-end', 
        backgroundColor: '#FF6A00' 
    },
    otherMessage: { 
        alignSelf: 'flex-start', 
        backgroundColor: '#E5E5EA' 
    },
    timeAndStatusWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 3, 
    },
    myTime: {
        color: 'rgba(255, 255, 255, 0.7)', 
        fontSize: 10,
    },
    otherTime: {
        color: '#666', 
        fontSize: 10,
        marginRight: 5,
    },
    
    // INPUT STILOVI
    inputContainer: {
        flexDirection: 'row',
        paddingHorizontal: 8,
        paddingTop: 8,
        borderTopColor: '#ddd',
        borderTopWidth: 1,
        alignItems: 'flex-end',
        backgroundColor: '#fff',
    },
    input: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#f2f2f2',
        borderRadius: 20,
        maxHeight: 100,
    },
    sendButton: { backgroundColor: '#FF6A00', borderRadius: 20, padding: 10, marginLeft: 8, justifyContent: 'center', alignItems: 'center' },
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    
    // STILOVI ZA ACTION SHEET MODAL
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'flex-end',
        paddingHorizontal: 10, 
        paddingBottom: Platform.OS === 'ios' ? 40 : 10, 
    },
    actionSheetWrapper: {
        width: '100%',
    },
    actionSheetGroup: {
        backgroundColor: 'white',
        borderRadius: 12, 
        overflow: 'hidden',
        marginBottom: 8,
    },
    menuItem: {
        paddingHorizontal: 20,
        paddingVertical: 16, 
        backgroundColor: 'white',
    },
    menuItemDestructive: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: 'white',
    },
    menuText: {
        fontSize: 18,
        color: '#333',
        textAlign: 'center',
    },
    menuTextDestructive: {
        fontSize: 18,
        color: '#FF3B30', 
        fontWeight: '600',
        textAlign: 'center',
    },
    separator: {
        height: 1,
        backgroundColor: '#E0E0E0',
    },
    cancelButton: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: 'white',
        borderRadius: 12, 
        marginTop: 10,
        marginBottom: Platform.OS === 'ios' ? 0 : 20, 
    },
    cancelText: {
        fontSize: 18,
        color: '#007AFF',
        textAlign: 'center',
        fontWeight: '600',
    }
});