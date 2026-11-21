import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { SelectOption } from '@/services/api';

interface Props {
  label: string;
  placeholder: string;
  searchPlaceholder: string;
  options: SelectOption[];
  selected: SelectOption | null;
  onSelect: (item: SelectOption) => void;
  disabled?: boolean;
  loading?: boolean;
}

export function SearchableSelect({
  label,
  placeholder,
  searchPlaceholder,
  options,
  selected,
  onSelect,
  disabled = false,
  loading = false,
}: Props) {
  const scheme = useColorScheme() ?? 'light';
  const theme = Colors[scheme];

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.code && item.code.toLowerCase().includes(q))
    );
  }, [options, query]);

  const handleChoose = (item: SelectOption) => {
    onSelect(item);
    setQuery('');
    setOpen(false);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>

      <Pressable
        disabled={disabled || loading}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.trigger,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.backgroundSelected,
            opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
          },
        ]}
      >
        <Text
          numberOfLines={1}
          style={[
            styles.triggerText,
            { color: selected ? theme.text : theme.textSecondary },
          ]}
        >
          {selected
            ? selected.code
              ? `${selected.name} (${selected.code})`
              : selected.name
            : placeholder}
        </Text>

        {loading ? (
          <ActivityIndicator size="small" color={theme.tint} />
        ) : (
          <Ionicons
            name="chevron-down"
            size={18}
            color={theme.textSecondary}
          />
        )}
      </Pressable>

      <Modal
        visible={open}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setOpen(false)}
      >
        <SafeAreaView style={[styles.modalSafe, { backgroundColor: theme.background }]}>
          <View
            style={[
              styles.modalHeader,
              { borderBottomColor: theme.backgroundSelected },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>{label}</Text>
            <Pressable onPress={() => setOpen(false)} hitSlop={10}>
              <Text style={[styles.closeBtn, { color: theme.tint }]}>Done</Text>
            </Pressable>
          </View>

          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.backgroundSelected,
              },
            ]}
          >
            <Ionicons name="search" size={18} color={theme.textSecondary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={searchPlaceholder}
              placeholderTextColor={theme.textSecondary}
              autoFocus
              style={[styles.searchInput, { color: theme.text }]}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')}>
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={theme.textSecondary}
                />
              </Pressable>
            )}
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No matching results found
              </Text>
            }
            renderItem={({ item }) => {
              const isSelected = selected?.id === item.id;
              return (
                <Pressable
                  onPress={() => handleChoose(item)}
                  style={[
                    styles.optionRow,
                    isSelected && { backgroundColor: theme.backgroundSelected },
                  ]}
                >
                  <Text style={[styles.optionText, { color: theme.text }]}>
                    {item.code ? `${item.name} (${item.code})` : item.name}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark" size={18} color={theme.tint} />
                  )}
                </Pressable>
              );
            }}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.three },
  label: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: Spacing.two,
  },
  trigger: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  triggerText: {
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 15,
  },
  modalSafe: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: {
    fontFamily: Fonts.sans,
    fontSize: 17,
    fontWeight: '700',
  },
  closeBtn: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    fontWeight: '600',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    margin: Spacing.three,
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 15,
  },
  listContent: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.five,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 6,
  },
  optionText: {
    flex: 1,
    fontFamily: Fonts.sans,
    fontSize: 15,
  },
  emptyText: {
    fontFamily: Fonts.sans,
    textAlign: 'center',
    marginTop: Spacing.five,
    fontSize: 14,
  },
});
