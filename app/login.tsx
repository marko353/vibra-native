import React, { useEffect, useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ActivityIndicator 
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { useForm, Controller } from 'react-hook-form';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AntDesign } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthContext } from '../context/AuthContext';

WebBrowser.maybeCompleteAuthSession();

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5000';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof schema>;

export default function LoginScreen() {
  const router = useRouter();
  const { setUser } = useAuthContext();
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [emailValue, setEmailValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onSubmit', // greške se prikazuju samo nakon submit-a
  });

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: '919552449039-9omu51tjlp421po9hjrncsebpe9dulp1.apps.googleusercontent.com',
    // Dodaj i iosClientId ili webClientId ako treba
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.authentication?.idToken;
      if (!idToken) {
        Toast.show({ type: 'error', text1: 'No ID token from Google' });
        return;
      }
      setLoading(true);
      axios.post(`${API_BASE_URL}/api/auth/google`, { token: idToken })
        .then(async (res) => {
          const userData = {
            id: res.data.id,
            fullName: res.data.fullName,
            email: res.data.email,
            token: res.data.token,
          };
          setUser(userData);
          // Čuvaj user i token u AsyncStorage
          await AsyncStorage.setItem('currentUser', JSON.stringify(userData));
          await AsyncStorage.setItem('token', userData.token);
          Toast.show({ type: 'success', text1: 'Logged in with Google' });
          router.replace('/profile');
        })
        .catch((err) => {
          console.error('Google login failed:', err);
          Toast.show({ type: 'error', text1: 'Google login failed' });
        })
        .finally(() => setLoading(false));
    } else if (response?.type === 'error') {
      Toast.show({ type: 'error', text1: 'Google login error' });
    }
  }, [response]);

  const onSubmit = async (data: FormData) => {
    setSubmitAttempted(true);
    setApiError(null);
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/login`, data);
      const userData = {
        id: res.data.id,
        fullName: res.data.fullName,
        email: res.data.email,
        token: res.data.token,
      };
      setUser(userData);
      // Čuvaj user i token u AsyncStorage
      await AsyncStorage.setItem('currentUser', JSON.stringify(userData));
      await AsyncStorage.setItem('token', userData.token);
      Toast.show({ type: 'success', text1: 'Login successful' });
      router.replace('/home');
    } catch (error: any) {
      console.error('Login error:', error);
      setApiError(error?.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container} accessible accessibilityLabel="Login screen">
      <View style={styles.topRight}>
        <TouchableOpacity 
          onPress={() => router.push('./signup')} 
          accessible 
          accessibilityRole="button" 
          accessibilityLabel="Go to Sign Up"
        >
          <Text style={styles.signUpText}>Sign Up</Text>
        </TouchableOpacity>
      </View>

      <Image source={require('@/assets/images/1000006380.png')} style={styles.logo} accessibilityLabel="Vibra logo" />

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value } }) => (
          <>
            <TextInput
              placeholder="Email"
              onChangeText={text => {
                onChange(text);
                setEmailValue(text);
              }}
              value={value}
              style={[styles.input, submitAttempted && errors.email && styles.inputError]}
              keyboardType="email-address"
              autoCapitalize="none"
              accessible
              accessibilityLabel="Email input"
              placeholderTextColor="#888"
              selectionColor="#4c8bf5"
              textContentType="username"  // za autofill
              autoComplete="email"        // za autofill
            />
            {submitAttempted && errors.email && <Text style={styles.error}>{errors.email.message}</Text>}
          </>
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, value } }) => (
          <>
            <TextInput
              placeholder="Password"
              onChangeText={text => {
                onChange(text);
                setPasswordValue(text);
              }}
              value={value}
              style={[styles.input, submitAttempted && errors.password && styles.inputError]}
              secureTextEntry
              accessible
              accessibilityLabel="Password input"
              placeholderTextColor="#888"
              selectionColor="#4c8bf5"
              textContentType="password"  // za autofill
              autoComplete="password"     // za autofill
            />
            {submitAttempted && errors.password && <Text style={styles.error}>{errors.password.message}</Text>}
          </>
        )}
      />

      {submitAttempted && apiError && <Text style={styles.error}>{apiError}</Text>}

      <TouchableOpacity
        onPress={handleSubmit(onSubmit)}
        style={[styles.button, (emailValue === '' || passwordValue === '' || loading) && styles.buttonDisabled]}
        disabled={emailValue === '' || passwordValue === '' || loading}
        accessible
        accessibilityRole="button"
        accessibilityLabel="Login button"
      >
        {loading ? <ActivityIndicator color="#ffff" /> : <Text style={styles.buttonText}>Login</Text>}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => {
          if (request) {
            promptAsync();
          } else {
            Toast.show({ type: 'error', text1: 'Google Auth not ready' });
          }
        }}
        disabled={!request || loading}
        style={[styles.googleButton, (loading || !request) && styles.buttonDisabled]}
        accessible
        accessibilityRole="button"
        accessibilityLabel="Continue with Google"
      >
        <AntDesign name="google" size={20} color="#fff" style={{ marginRight: 12 }} />
        <Text style={styles.googleButtonText}>Continue with Google</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={() => router.push('/forgot-password')} 
        accessible 
        accessibilityRole="button" 
        accessibilityLabel="Forgot Password"
      >
        <Text style={styles.forgotPassword}>Forgot Password?</Text>
      </TouchableOpacity>

      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 60,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    flex: 1,
    alignItems: 'center',
  },
  topRight: {
    position: 'absolute',
    top: 40,
    right: 20,
  },
  signUpText: {
    color: '#ff7f00',  // narandžasta
    fontSize: 16,
    fontWeight: 'bold',
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 30,
    marginTop: 20,
    resizeMode: 'contain',
  },
  input: {
    width: '100%',
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
    backgroundColor: '#fafafa',
    fontSize: 16,
    color: '#222',
  },
  inputError: {
    borderColor: '#d00', // crvena
  },
  button: {
    backgroundColor: '#ff7f00', 
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginTop: 10,
    width: '100%',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 18,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d00', 
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginTop: 24,
    width: '100%',
    justifyContent: 'center',
  },
  googleButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  error: {
    color: '#d00', // crvena
    marginBottom: 8,
    alignSelf: 'flex-start',
    fontWeight: '600',
  },
  forgotPassword: {
    marginTop: 22,
    color: '#ffcc00', // žuta
    fontWeight: '700',
    fontSize: 15,
    textDecorationLine: 'underline',
  },
});
