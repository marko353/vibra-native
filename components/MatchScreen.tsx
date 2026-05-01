import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

const MatchScreen = ({ route }: { route: any }) => {
  const { matchedUser } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Čestitamo! Imate novi meč!</Text>
      {matchedUser?.avatar && (
        <Image source={{ uri: matchedUser.avatar }} style={styles.avatar} />
      )}
      <Text style={styles.name}>{matchedUser?.fullName}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
  },
});

export default MatchScreen;