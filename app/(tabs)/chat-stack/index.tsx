import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthContext } from '../../../context/AuthContext';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../../../components/Header';
import { useFocusEffect } from 'expo-router'; 

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const DEFAULT_AVATAR = 'https://placekitten.com/70/70'; 

export default function ChatScreen() {
    console.log('🔄 [RENDER] Komponenta ChatScreen se renderuje.');
    
    const { user } = useAuthContext();
    const router = useRouter();
    const queryClient = useQueryClient();

    // 1. DOHVATANJE PODATAKA (sa refetch funkcijom)
    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['my-matches', user?.id],
        queryFn: async () => {
            if (!user?.token) {
                console.warn('📥 [FETCH] Preskačem. Nedostaje token.');
                return { newMatches: [], conversations: [] };
            }
            console.log('📥 [FETCH] Pokrećem `queryFn` za `my-matches`...');
            try {
                const response = await axios.get(`${API_BASE_URL}/api/user/my-matches`, {
                    headers: { Authorization: `Bearer ${user.token}` },
                });
                console.log(`   -> ✅ [FETCH] Uspeh! Dobijeni podaci: ${response.data.newMatches.length} novih spojeva, ${response.data.conversations.length} razgovora.`);
                return response.data;
            } catch (fetchError) {
                console.error('   -> ❌ [FETCH] Greška u `queryFn`!', fetchError);
                throw fetchError;
            }
        },
        enabled: !!user?.token,
    });
    
    // 2. LOGIKA PONOVNOG UČITAVANJA NA FOKUS TAB-a
    useFocusEffect(
        React.useCallback(() => {
            console.log('✨ [FOCUS] Ekran je u fokusu, pokrećem refetch...');
            refetch(); 
        }, [refetch])
    );

    // 3. FUNKCIJA ZA NAVIGACIJU (sa ispravljenim avatar fallback-om)
    const handleOpenChat = (chatUser: any, conversationId: string) => {
        console.log('🚀 [NAVIGACIJA] Pokrenut handleOpenChat...');
        
        const params = {
            chatId: conversationId,
            userName: chatUser.fullName,
            userAvatar: chatUser.avatar || DEFAULT_AVATAR,
            receiverId: chatUser._id, // ✅ KLJUČNA ISPRAVKA
        };
        
        console.log('   -> Šaljem parametre:', params);

        router.push({ 
            pathname: `/chat-stack/[chatId]`, 
            params: params 
        });
    };
    
    const { newMatches = [], conversations = [] } = data || {};
    console.log(`📊 [DATA] Podaci spremni za prikaz. Loading: ${isLoading}, Error: ${isError}`);

    return (
        <SafeAreaView style={styles.container}>
            <Header />
            {isLoading ? (
                <ActivityIndicator style={styles.center} size="large" color="#FF6A00" />
            ) : isError ? (
                <View style={styles.center}><Text>Došlo je do greške pri učitavanju.</Text></View>
            ) : (
                <ScrollView
                    refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
                >
                    {newMatches.length === 0 && conversations.length === 0 ? (
                        <View style={styles.center}><Text style={styles.emptyText}>Nemaš još nijedan spoj. Nastavi da prevlačiš!</Text></View>
                    ) : (
                        <>
                            {/* SEKCIJA NOVI SPOJEVI */}
                            {newMatches.length > 0 && (
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Novi spojevi</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.newMatchesContainer}>
                                        {newMatches.map((match: any) => (
                                            <TouchableOpacity key={match._id} style={styles.matchItem} onPress={() => handleOpenChat(match, match.chatId)}>
                                                <Image source={{ uri: match.avatar || DEFAULT_AVATAR }} style={styles.matchAvatar} />
                                                <Text style={styles.matchName} numberOfLines={1}>{match.fullName}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}

                            {/* SEKCIJA PORUKE */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Poruke</Text>
                                {conversations.length === 0 ? (
                                    <Text style={styles.emptyText}>Započni razgovor sa nekim od novih spojeva!</Text>
                                ) : (
                                    conversations.map((item: any) => (
                                        <TouchableOpacity key={item.chatId} style={styles.conversationRow} onPress={() => handleOpenChat(item.user, item.chatId)}>
                                            <Image source={{ uri: item.user.avatar || DEFAULT_AVATAR }} style={styles.conversationAvatar} />
                                            <View style={styles.conversationTextContainer}>
                                                <Text style={styles.conversationName}>{item.user.fullName}</Text>
                                                <Text style={styles.lastMessage} numberOfLines={1}>{item.lastMessage?.text}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    ))
                                )}
                            </View>
                        </>
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, minHeight: 300 },
    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', paddingHorizontal: 20, marginBottom: 15 },
    newMatchesContainer: { paddingLeft: 20, paddingRight: 10 },
    matchItem: { marginRight: 15, alignItems: 'center', width: 80 },
    matchAvatar: { width: 70, height: 70, borderRadius: 35, borderWidth: 2, borderColor: '#FF6A00' },
    matchName: { marginTop: 8, fontSize: 13, fontWeight: '600', color: '#333' },
    conversationRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 25 },
    conversationAvatar: { width: 60, height: 60, borderRadius: 30 },
    conversationTextContainer: { flex: 1, marginLeft: 15, justifyContent: 'center' },
    conversationName: { fontSize: 17, fontWeight: 'bold', marginBottom: 2 },
    lastMessage: { fontSize: 15, color: '#666' },
    emptyText: { paddingHorizontal: 20, color: '#888', fontSize: 15, textAlign: 'center' },
});