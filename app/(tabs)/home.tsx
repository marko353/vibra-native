import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, StatusBar, TouchableOpacity, Modal } from 'react-native';
import { useAuthContext } from '../../context/AuthContext';
import axios from 'axios';
import LottieView from 'lottie-react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  interpolate
} from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Card from '../../components/CardComponent';
import Header from '../../components/Header';
import ProfileInfoPanel from '../../components/ProfileInfoPanel';
import MatchAnimation from '../../components/MatchAnimation'; 
import { UserProfile } from '../../context/ProfileContext';

const { width, height } = Dimensions.get('window');
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

// ❤️ Butterfly animacija
interface ButterflyParticleProps {
  onAnimationFinish: () => void;
  start: boolean;
}

const ButterflyParticle = ({ onAnimationFinish, start }: ButterflyParticleProps) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (start) {
      progress.value = withTiming(1, { duration: 1500 }, (isFinished) => {
        if (isFinished) runOnJS(onAnimationFinish)();
      });
    }
  }, [start]);

  const animatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(progress.value, [0, 0.5, 1], [0, -height * 0.5, -height]);
    const opacity = interpolate(progress.value, [0, 0.8, 1], [1, 1, 0]);
    const scale = interpolate(progress.value, [0, 1], [0.5, 1.5]);
    const rotate = interpolate(progress.value, [0, 1], [0, 360]);

    return { opacity, transform: [{ translateY }, { scale }, { rotate: `${rotate}deg` }] };
  });

  return (
    <Animated.View style={[styles.butterflyParticle, animatedStyle]}>
      <Icon name="heart" size={40} color="#FF69B4" />
    </Animated.View>
  );
};

export default function HomeTab() {
  const { user } = useAuthContext();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [butterflyParticles, setButterflyParticles] = useState<any[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isPanelVisible, setPanelVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [matchData, setMatchData] = useState<UserProfile | null>(null);
  const [toastMessage, setToastMessage] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3000); 
  }, []);

  const fetchUsers = useCallback(async () => {
    if (!user?.token || !user?.id) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/user/all-users`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const filteredUsers = response.data.users.filter((u: any) => u._id !== user.id);
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Greška pri dohvatanju korisnika:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.token && user?.id) fetchUsers();
  }, [user, fetchUsers]);

  const handleInfoPress = (userToShow: UserProfile) => {
    setSelectedUser(userToShow);
    setPanelVisible(true);
  };

  const handleClosePanel = () => {
    setPanelVisible(false);
    setTimeout(() => setSelectedUser(null), 300);
  };

  const triggerButterflyAnimation = () => {
    const id = Date.now();
    setButterflyParticles(prev => [...prev, { id, start: true }]);
  };

  const removeParticle = (id: number) => {
    setButterflyParticles(prev => prev.filter(p => p.id !== id));
  };

  const handleSwipe = useCallback(async (targetUserId: string, direction: 'left' | 'right') => {
    if (direction === 'right') triggerButterflyAnimation();
    
    setUsers(prevUsers => prevUsers.slice(1));
    setCurrentImageIndex(0);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/user/swipe`, {
        targetUserId,
        action: direction === 'right' ? 'like' : 'dislike',
      }, { headers: { Authorization: `Bearer ${user?.token}` } });

      if (response.data.match) {
        console.log("MATCH!", response.data.matchedUser);
        setMatchData(response.data.matchedUser);
      }

    } catch (error) {
      console.error('Greška pri slanju swipe-a:', error);
    }
  }, [user]);

  const handleButtonSwipe = (direction: 'left' | 'right') => {
    const topUser = users[0];
    if (topUser && topUser._id) {
      handleSwipe(topUser._id, direction);
    }
  };

  const handleImageChange = (direction: 'left' | 'right') => {
    if (users.length === 0) return;
    setCurrentImageIndex(prevIndex => {
      const totalImages = users[0]?.profilePictures?.length || 0;
      if (totalImages <= 1) return prevIndex;
      return direction === 'right' ? (prevIndex + 1) % totalImages : (prevIndex - 1 + totalImages) % totalImages;
    });
  };

  const closeMatchAnimation = () => {
    setMatchData(null);
  };

  const handleSendMessageFromMatch = useCallback(async (message: string) => { 
    if (!matchData || !user?.token || !user?.id) {
        closeMatchAnimation();
        return;
    }
    
    const targetUserId = matchData._id;
    const targetUserName = matchData.fullName;
    const trimmedMessage = message.trim();
    
    if (trimmedMessage) {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/user/message`, {
                recipientId: targetUserId,
                text: trimmedMessage,
            }, { 
                headers: { Authorization: `Bearer ${user.token}` } 
            });

            if (response.status === 200 || response.status === 201) {
                console.log(`Poruka uspešno poslata korisniku ${targetUserName}.`);
                showToast(`Poruka uspešno poslata korisniku ${targetUserName}!`, 'success');
            } else {
                throw new Error('Neočekivan odgovor servera.');
            }
            
        } catch (error) {
            console.error('Greška pri slanju poruke:', error);
            showToast('Greška pri slanju poruke. Pokušajte ponovo.', 'error');
        }
    } else {
        showToast(`Match sa ${targetUserName} sačuvan!`, 'success');
    }

    closeMatchAnimation();
  }, [matchData, user, showToast]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <Header />

        <View style={styles.contentContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <LottieView source={require('../../assets/animations/butterflies.json')} autoPlay loop style={styles.lottieLoader} />
              <Text style={styles.loadingText}>Tražimo tvoju VIBRU...</Text>
            </View>
          ) : users.length === 0 ? (
            <View style={styles.noMoreCardsContainer}>
              <LottieView source={require('../../assets/animations/butterflies.json')} autoPlay loop={false} style={styles.lottieNoMore} />
              <Text style={styles.noMoreCardsText}>To je sve za sada!</Text>
              <Text style={styles.noMoreCardsSubText}>Vrati se uskoro da vidiš nove ljude.</Text>
              <TouchableOpacity style={styles.refreshButton} onPress={fetchUsers}>
                <Icon name="refresh-outline" size={24} color="#E91E63" />
                <Text style={styles.refreshButtonText}>Osveži</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.cardStack}>
              {users.slice(0, 3).reverse().map((userItem, index, arr) => {
                const isTopCard = index === arr.length - 1;
                return (
                  <Card
                    key={userItem._id}
                    user={userItem}
                    onSwipe={handleSwipe}
                    currentImageIndex={isTopCard ? currentImageIndex : 0}
                    onImageChange={handleImageChange}
                    isTopCard={isTopCard}
                    onInfoPress={handleInfoPress}
                  />
                );
              })}
            </View>
          )}

          {butterflyParticles.map(p => (
            <ButterflyParticle key={p.id} start={p.start} onAnimationFinish={() => removeParticle(p.id)} />
          ))}

          {users.length > 0 && !isLoading && (
            <View style={styles.controlsContainer}>
              <TouchableOpacity style={styles.controlButton} onPress={() => handleButtonSwipe('left')}>
                <Icon name="close" size={40} color="#FF6B6B" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.starButton}>
                <Icon name="star" size={25} color="#6C5CE7" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlButton} onPress={() => handleButtonSwipe('right')}>
                <Icon name="heart" size={40} color="#4CCC93" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Modal za Profile Info */}
        <Modal
          animationType="none"
          transparent={true}
          visible={isPanelVisible}
          onRequestClose={handleClosePanel}
        >
          <ProfileInfoPanel 
            user={selectedUser}
            isVisible={isPanelVisible}
            onClose={handleClosePanel}
            onLike={() => { if (selectedUser?._id) { handleSwipe(selectedUser._id, 'right'); handleClosePanel(); } }}
            onNope={() => { if (selectedUser?._id) { handleSwipe(selectedUser._id, 'left'); handleClosePanel(); } }}
          />
        </Modal>

        {/* ✅ MATCH FULLSCREEN MODAL */}
        {!!matchData && (
          <Modal
            visible={true}
            animationType="fade"
            transparent={true}
            onRequestClose={closeMatchAnimation}
          >
            <View style={styles.fullScreenMatch}>
              <MatchAnimation 
                matchedUser={matchData!}
                onSendMessage={handleSendMessageFromMatch} 
                onClose={closeMatchAnimation}
              />
            </View>
          </Modal>
        )}

        {/* Toast */}
        {!!toastMessage && (
          <View style={[styles.toastContainer, toastMessage.type === 'success' ? styles.toastSuccess : styles.toastError]}>
            <Icon 
              name={toastMessage.type === 'success' ? "checkmark-circle" : "alert-circle"} 
              size={20} 
              color="#fff" 
              style={{ marginRight: 10 }}
            />
            <Text style={styles.toastText}>{toastMessage.message}</Text>
          </View>
        )}
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  contentContainer: { flex: 1, position: 'relative' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cardStack: { flex: 1 },
  noMoreCardsContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  loadingText: { fontSize: 18, color: '#E91E63', fontWeight: '600', marginTop: -20 },
  noMoreCardsText: { fontSize: 24, fontWeight: 'bold', color: '#E91E63', marginTop: -20 },
  noMoreCardsSubText: { fontSize: 16, color: '#AD1457', textAlign: 'center', marginTop: 10 },
  refreshButtonText: { marginLeft: 10, color: '#E91E63', fontWeight: '600', fontSize: 16 },
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  controlButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 10,
  },
  starButton: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.12)',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 8,
  },
  refreshButton: {
    flexDirection: 'row',
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  lottieLoader: { width: 250, height: 250 },
  lottieNoMore: { width: 200, height: 200 },
  butterflyParticle: { position: 'absolute', bottom: 50, alignSelf: 'center', zIndex: 999 },
  fullScreenMatch: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toastContainer: {
    position: 'absolute',
    top: 50, 
    alignSelf: 'center',
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 99999,
    elevation: 20,
    maxWidth: '90%',
  },
  toastSuccess: { backgroundColor: '#4CAF50' },
  toastError: { backgroundColor: '#F44336' },
  toastText: { color: '#fff', fontWeight: '600', fontSize: 14, flexShrink: 1 },
});
