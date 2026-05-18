import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
// Animated Button (isti kao na Login)
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

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { userId, token } = useLocalSearchParams<{ userId: string; token: string }>();
  const { height } = useWindowDimensions();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const isValid =
    password.trim().length >= 6 && confirmPassword.trim().length >= 6;

  const handleChangePassword = async () => {
    // Guard: invalid link
    if (!userId || !token) {
      Toast.show({ type: 'error', text1: 'Invalid reset link.' });
      return;
    }

    if (password.trim().length < 6) {
      Toast.show({ type: 'error', text1: 'Password must be at least 6 characters.' });
      return;
    }

    if (password.trim() !== confirmPassword.trim()) {
      Toast.show({ type: 'error', text1: 'Passwords do not match.' });
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${API_BASE_URL}/api/auth/reset-password`, {
        userId,
        token,
        newPassword: password.trim(),
      });

      Toast.show({ type: 'success', text1: 'Password changed!', text2: 'You can now log in.' });
      setTimeout(() => router.replace('../login'), 1500);
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Something went wrong.';
      Toast.show({ type: 'error', text1: msg });
    } finally {
      setLoading(false);
    }
  };

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
          {/* Back button */}
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
            {/* Lock icon */}
            <View style={styles.iconCircle}>
              <Ionicons name="lock-closed" size={28} color={ORANGE} />
            </View>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Choose a strong password you haven&apos;t used before
            </Text>
          </View>

          {/* New Password */}
          <View style={styles.fieldGroup}>
            <Pressable
              style={[
                styles.inputRow,
                styles.inputWithShadow,
                focusedInput === 'password' && styles.inputFocused,
              ]}
              onPress={() => passwordRef.current?.focus()}
            >
              <Ionicons
                name="lock-closed-outline"
                size={19}
                color={focusedInput === 'password' ? ORANGE : '#C7C7CC'}
              />
              <TextInput
                ref={passwordRef}
                placeholder="New password"
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                secureTextEntry={!showPassword}
                autoCorrect={false}
                textContentType="newPassword"
                autoComplete="new-password"
                placeholderTextColor="#C7C7CC"
                selectionColor={ORANGE}
                returnKeyType="next"
                onSubmitEditing={() => confirmRef.current?.focus()}
                onFocus={() => setFocusedInput('password')}
                onBlur={() => setFocusedInput(null)}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={14}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#C7C7CC"
                />
              </TouchableOpacity>
            </Pressable>
          </View>

          {/* Confirm Password */}
          <View style={styles.fieldGroup}>
            <Pressable
              style={[
                styles.inputRow,
                styles.inputWithShadow,
                focusedInput === 'confirm' && styles.inputFocused,
                confirmPassword.length > 0 &&
                  password !== confirmPassword &&
                  styles.inputErrorBorder,
              ]}
              onPress={() => confirmRef.current?.focus()}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={19}
                color={focusedInput === 'confirm' ? ORANGE : '#C7C7CC'}
              />
              <TextInput
                ref={confirmRef}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                style={styles.input}
                secureTextEntry={!showConfirm}
                autoCorrect={false}
                textContentType="newPassword"
                autoComplete="new-password"
                placeholderTextColor="#C7C7CC"
                selectionColor={ORANGE}
                returnKeyType="done"
                onSubmitEditing={handleChangePassword}
                onFocus={() => setFocusedInput('confirm')}
                onBlur={() => setFocusedInput(null)}
              />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} hitSlop={14}>
                <Ionicons
                  name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#C7C7CC"
                />
              </TouchableOpacity>
            </Pressable>

            {/* Inline mismatch hint */}
            {confirmPassword.length > 0 && password !== confirmPassword && (
              <View style={styles.hintRow}>
                <Ionicons name="alert-circle" size={13} color="#FF5A5F" />
                <Text style={styles.hintText}>Passwords do not match</Text>
              </View>
            )}
          </View>

          {/* Password strength hint */}
          {password.length > 0 && password.length < 6 && (
            <View style={styles.hintRow}>
              <Ionicons name="information-circle-outline" size={13} color="#AEAEB2" />
              <Text style={styles.hintText}>At least 6 characters required</Text>
            </View>
          )}

          <View style={{ marginTop: 8 }}>
            <AnimatedButton
              onPress={handleChangePassword}
              disabled={!isValid || loading}
              loading={loading}
              label="Change Password"
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
  toastContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
});