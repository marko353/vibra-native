import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform, TextInput, Keyboard, Dimensions, KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Modal from 'react-native-modal'; 

const windowHeight = Dimensions.get('window').height;

const COLORS = {
  primary: '#5B41F5',
  background: '#F0F2F5',
  cardBackground: '#FFFFFF',
  textPrimary: '#1E1E1E',
  textSecondary: '#666666',
  placeholder: '#A0A0A0',
  border: '#E0E0E0',
};

interface JobModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (job: string | null) => void;
  currentJob: string;
}

const JobModal: React.FC<JobModalProps> = ({ isVisible, onClose, onSave, currentJob }) => {
  const [jobTitle, setJobTitle] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setJobTitle(currentJob);
    }
  }, [isVisible, currentJob]);

  const handleSave = () => {
    Keyboard.dismiss();
    onSave(jobTitle);
  };

  return (
    <Modal
      isVisible={isVisible}
      onSwipeComplete={onClose}
      swipeDirection={['down']}
      onBackdropPress={onClose}
      style={styles.modal}
      propagateSwipe
      avoidKeyboard={false} // Isključujemo avoidKeyboard iz react-native-modal
    >
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalContent}>
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} style={styles.backButton}>
                <Ionicons name="close" size={28} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Posao</Text>
              <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                <Text style={styles.saveButtonText}>Sačuvaj</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.content}>
              <Text style={styles.label}>Tvoj posao/zanimanje</Text>
              <TextInput
                style={[styles.textInput, isFocused && styles.textInputFocused]}
                placeholder="Npr. Softver inženjer, Dizajner"
                placeholderTextColor={COLORS.placeholder}
                value={jobTitle || ''}
                onChangeText={setJobTitle}
                maxLength={50}
                returnKeyType="done"
                onSubmitEditing={handleSave}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
              />
            </View>
          </SafeAreaView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  keyboardAvoidingContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.cardBackground,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: windowHeight * 0.5,
    overflow: 'hidden',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
    backgroundColor: COLORS.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  saveButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
  },
  saveButtonText: {
    color: COLORS.cardBackground,
    fontWeight: '600',
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 20,
    backgroundColor: COLORS.background,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 15,
  },
  textInput: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 15,
    paddingVertical: 18,
    paddingHorizontal: 20,
    fontSize: 16,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  textInputFocused: {
    borderColor: COLORS.primary,
    shadowOpacity: 0.2,
    elevation: 6,
  },
});

export default JobModal;