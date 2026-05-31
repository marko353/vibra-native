// SHARED STYLES I KOMPONENTE ZA SVE MODALE
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const MODAL_COLORS = {
  primary: '#ff7f00',
  textPrimary: '#1a1a1a',
  textSecondary: '#999',
  textPlaceholder: '#C8C8C8',
  background: '#fff',
  border: '#ECECEC',
  selectedBg: '#fff5ec',
  selectedBorder: '#ffd0a8',
  iconBg: '#fff5ec',
  iconBorder: '#ffd0a8',
};

export const ModalDragHandle = () => (
  <View style={modalStyles.dragHandle} />
);

export const ModalHeader = ({
  title,
  onClose,
  onSave,
  hasChanges,
  isPending,
}: {
  title: string;
  onClose: () => void;
  onSave: () => void;
  hasChanges: boolean;
  isPending: boolean;
}) => (
  <View style={modalStyles.header}>
    <TouchableOpacity style={modalStyles.closeBtn} onPress={onClose} disabled={isPending} activeOpacity={0.7}>
      <AntDesign name="close" size={20} color="#1a1a1a" />
    </TouchableOpacity>
    <Text style={modalStyles.headerTitle}>{title}</Text>
    <TouchableOpacity
      style={[modalStyles.saveBtn, hasChanges && modalStyles.saveBtnActive]}
      onPress={onSave}
      disabled={!hasChanges || isPending}
      activeOpacity={0.8}
    >
      {isPending ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <Text style={[modalStyles.saveBtnText, hasChanges && modalStyles.saveBtnTextActive]}>
          Save
        </Text>
      )}
    </TouchableOpacity>
  </View>
);

export const OptionItem = ({
  emoji,
  title,
  description,
  isSelected,
  onPress,
  disabled,
}: {
  emoji: string;
  title: string;
  description: string;
  isSelected: boolean;
  onPress: () => void;
  disabled: boolean;
}) => (
  <TouchableOpacity
    style={[modalStyles.option, isSelected && modalStyles.optionSelected]}
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.7}
  >
    <View style={[modalStyles.optionEmoji, isSelected && modalStyles.optionEmojiSelected]}>
      <Text style={modalStyles.emojiText}>{emoji}</Text>
    </View>
    <View style={modalStyles.optionContent}>
      <Text style={[modalStyles.optionTitle, isSelected && modalStyles.optionTitleSelected]}>
        {title}
      </Text>
      <Text style={modalStyles.optionDescription}>{description}</Text>
    </View>
    {isSelected && <Ionicons name="checkmark-circle" size={22} color={MODAL_COLORS.primary} />}
  </TouchableOpacity>
);

export const modalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ECECEC',
    marginBottom: 16,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: -0.3,
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
  },
  saveBtnActive: {
    backgroundColor: '#ff7f00',
    shadowColor: '#ff7f00',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C8C8C8',
  },
  saveBtnTextActive: {
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
  },
  list: {
    paddingBottom: 24,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#ECECEC',
    backgroundColor: '#fff',
    marginBottom: 10,
    gap: 12,
  },
  optionSelected: {
    borderColor: '#ffd0a8',
    backgroundColor: '#fff5ec',
    shadowColor: '#ff7f00',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  optionEmoji: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  optionEmojiSelected: {
    backgroundColor: '#fff5ec',
    borderWidth: 1,
    borderColor: '#ffd0a8',
  },
  emojiText: { fontSize: 20 },
  optionContent: { flex: 1 },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  optionTitleSelected: { color: '#ff7f00' },
  optionDescription: {
    fontSize: 12,
    color: '#999',
    lineHeight: 16,
  },
});