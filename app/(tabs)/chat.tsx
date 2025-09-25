import { View, Text, StyleSheet } from 'react-native';
import Header from '../../components/Header'; // 1. Dodajemo import

export default function ChatScreen() { // Preporučujem da preimenujete komponentu
  return (
    <View style={styles.mainContainer}>
      

      <Header />

      <View style={styles.content}>
        <Text style={styles.text}>Chat</Text>
      </View>
      
    </View>
  );
}

const styles = StyleSheet.create({
  // Glavni kontejner koji zauzima ceo ekran
  mainContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  // Kontejner za sadržaj ispod headera
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});