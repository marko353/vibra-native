import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import axios from 'axios';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5000'; // Replace ' with &apos;
const ORANGE = '#FF6A00'; // Replace ' with &apos;

// ─────────────────────────────────────────────────────────────
// Animated Button
// ─────────────────────────────────────────────────────────────

function AnimatedButton({
  onPress,
  disabled,
  loading,
  label,
}: {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  label: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <LinearGradient
          colors={
            disabled
              ? (['#FFB37A', '#FFB37A'] as const)
              : (['#FF6A00', '#FF8A3D'] as const)
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.primaryBtn, disabled && styles.primaryBtnDisabled]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryBtnText}>{label}</Text>
          )}
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { height } = useWindowDimensions();

  const [email, setEmail] = useState('');
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const emailRef = useRef<TextInput>(null);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleNext = async () => {
    if (!isValidEmail) {
      Toast.show({ type: 'error', text1: 'Please enter a valid email address.' }); // Replace ' with &apos;
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, {
        email: email.trim(),
      });
      setSent(true);
    } catch (error: any) {
      const message =
        error?.response?.data?.message || 'Something went wrong. Please try again.'; // Replace ' with &apos;
      Toast.show({ type: 'error', text1: message }); // Replace ' with &apos;
    } finally {
      setLoading(false);
    }
  };

  // ─── Success State ────────────────────────────────────────────

  if (sent) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.successContainer}>
          <View style={styles.successIconCircle}>
            <Ionicons name="mail" size={32} color={ORANGE} />
          </View>
          <Text style={styles.successTitle}>Check your inbox</Text>
          <Text style={styles.successSubtitle}>
            We sent a password reset link to{'\n'}
            <Text style={styles.successEmail}>{email.trim()}</Text>
          </Text>
          <TouchableOpacity
            style={styles.backToLoginBtn}
            onPress={() => router.back()}
            hitSlop={12}
          >
            <Ionicons name="chevron-back" size={16} color={ORANGE} />
            <Text style={styles.backToLoginText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.toastContainer} pointerEvents="box-none">
          <Toast />
        </View>
      </SafeAreaView>
    );
  }

  // ─── Main Form ────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={20}
      >
        <ScrollView
          contentContainerStyle={[
            styles.container,
            { paddingTop: Math.max(height * 0.06, 36) },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Back */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            hitSlop={12}
          >
            <Ionicons name="chevron-back" size={22} color={ORANGE} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={[styles.headerContainer, { marginBottom: Math.max(height * 0.04, 28) }]}>
            <View style={styles.iconCircle}>
              <Ionicons name="key" size={28} color={ORANGE} />
            </View>
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              Enter your Vibra email and we&apos;ll send you a link to reset your password.
            </Text>
          </View>

          {/* Email Input */}
          <View style={styles.fieldGroup}>
            <Pressable
              style={[
                styles.inputRow,
                styles.inputWithShadow,
                focusedInput === 'email' && styles.inputFocused,
                email.length > 0 && !isValidEmail && styles.inputErrorBorder,
              ]}
              onPress={() => emailRef.current?.focus()}
            >
              <Ionicons
                name="mail-outline"
                size={19}
                color={focusedInput === 'email' ? ORANGE : '#C7C7CC'}
              />
              <TextInput
                ref={emailRef}
                placeholder="Email address"
                value={email}
                onChangeText={(t) => setEmail(t.trim())}
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                textContentType="emailAddress"
                autoComplete="email"
                autoCorrect={false}
                placeholderTextColor="#C7C7CC"
                selectionColor={ORANGE}
                returnKeyType="done"
                onSubmitEditing={handleNext}
                onFocus={() => setFocusedInput('email')}
                onBlur={() => setFocusedInput(null)}
              />
              {isValidEmail && (
                <Ionicons name="checkmark-circle" size={18} color="#34C759" />
              )}
            </Pressable>

            {email.length > 0 && !isValidEmail && (
              <View style={styles.hintRow}>
                <Ionicons name="alert-circle" size={13} color="#FF5A5F" />
                <Text style={styles.hintText}>Enter a valid email address</Text>
              </View>
            )}
          </View>

          <View style={{ marginTop: 8 }}>
            <AnimatedButton
              onPress={handleNext}
              disabled={!isValidEmail || loading}
              loading={loading}
              label="Send Reset Link"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.toastContainer} pointerEvents="box-none">
        <Toast />
      </View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FCFCFD',
  },
  flex: {
    flex: 1,
    backgroundColor: '#FCFCFD',
  },
  container: {
    flexGrow: 1,
    backgroundColor: '#FCFCFD',
    paddingHorizontal: 24,
    paddingBottom: 44,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 32,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 15,
    color: ORANGE,
    fontWeight: '600',
  },
  headerContainer: {
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#FFF3EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    color: '#8E8E93',
    fontWeight: '400',
    lineHeight: 22,
  },
  fieldGroup: {
    width: '100%',
    marginBottom: 14,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 16,
  },
  inputWithShadow: {
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  inputFocused: {
    borderColor: ORANGE,
    backgroundColor: '#fff',
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 2,
  },
  inputErrorBorder: {
    borderColor: '#FF5A5F',
    backgroundColor: '#FFF9F9',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1C1C1E',
    fontWeight: '400',
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
    paddingHorizontal: 4,
  },
  hintText: {
    fontSize: 12,
    color: '#FF5A5F',
    fontWeight: '500',
  },
  primaryBtn: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  primaryBtnDisabled: {
    opacity: 0.7,
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  // ─── Success State ───────────────────────────────────────────
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#FCFCFD',
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#FFF3EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  successSubtitle: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 36,
  },
  successEmail: {
    color: '#1C1C1E',
    fontWeight: '600',
  },
  backToLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backToLoginText: {
    fontSize: 15,
    color: ORANGE,
    fontWeight: '600',
  },
  toastContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
});