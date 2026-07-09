import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Share2, UserPlus } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AccentColor, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { strings } from '@/i18n/strings.id';
import { useFriends } from '@/state/friends';

const CODE_LENGTH = 6;

export default function TambahTemanScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const myCode = useFriends((s) => s.myCode);
  const sendRequest = useFriends((s) => s.sendRequest);
  const actionError = useFriends((s) => s.actionError);
  const clearActionError = useFriends((s) => s.clearActionError);

  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Clear any stale error when leaving the screen.
  useEffect(() => () => clearActionError(), [clearActionError]);

  const onChange = useCallback(
    (text: string) => {
      if (actionError) clearActionError();
      // Uppercase, strip whitespace, cap at code length.
      setCode(text.toUpperCase().replace(/\s/g, '').slice(0, CODE_LENGTH));
    },
    [actionError, clearActionError]
  );

  const onSubmit = useCallback(async () => {
    setSubmitting(true);
    const ok = await sendRequest(code);
    setSubmitting(false);
    if (ok) router.back();
  }, [code, sendRequest, router]);

  const onShare = useCallback(() => {
    if (!myCode) return;
    void Share.share({ message: strings.bagikanKodePesan(myCode) });
  }, [myCode]);

  const canSubmit = code.length === CODE_LENGTH && !submitting;

  return (
    <ThemedView style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
        <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={strings.batal}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <ArrowLeft color={AccentColor} size={22} />
          </Pressable>
          <ThemedText type="subtitle" style={styles.headerTitle}>
            {strings.tambahTeman}
          </ThemedText>
          <View style={styles.backButton} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}>
          <View style={styles.content}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.label}>
              {strings.masukkanKode.toUpperCase()}
            </ThemedText>
            <TextInput
              value={code}
              onChangeText={onChange}
              autoCapitalize="characters"
              autoCorrect={false}
              autoComplete="off"
              autoFocus
              maxLength={CODE_LENGTH}
              placeholder="XXXXXX"
              placeholderTextColor={theme.textSecondary}
              returnKeyType="done"
              onSubmitEditing={canSubmit ? onSubmit : undefined}
              accessibilityLabel={strings.masukkanKode}
              style={[
                styles.input,
                {
                  backgroundColor: theme.backgroundElement,
                  color: theme.text,
                  borderColor: actionError ? AccentColor : theme.backgroundSelected,
                },
              ]}
            />
            <ThemedText
              type="small"
              themeColor="textSecondary"
              style={[styles.hint, actionError ? styles.errorText : null]}>
              {actionError ?? strings.masukkanKodeHint}
            </ThemedText>

            <Pressable
              onPress={onSubmit}
              disabled={!canSubmit}
              accessibilityRole="button"
              accessibilityLabel={strings.kirimPermintaan}
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && styles.pressed,
                !canSubmit && styles.disabled,
              ]}>
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <UserPlus color="#fff" size={18} strokeWidth={2.4} />
                  <ThemedText type="smallBold" style={styles.primaryBtnText}>
                    {strings.kirimPermintaan}
                  </ThemedText>
                </>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>

        {/* Share own code footer */}
        <View style={[styles.footer, { borderColor: theme.backgroundSelected }]}>
          <View style={styles.footerText}>
            <ThemedText type="small" themeColor="textSecondary">
              {strings.kodeTemanku}
            </ThemedText>
            <ThemedText type="smallBold" style={styles.footerCode}>
              {myCode ?? '••••••'}
            </ThemedText>
          </View>
          <Pressable
            onPress={onShare}
            disabled={!myCode}
            accessibilityRole="button"
            accessibilityLabel={strings.bagikanKode}
            style={({ pressed }) => [
              styles.shareBtn,
              { borderColor: theme.backgroundSelected },
              pressed && styles.pressed,
              !myCode && styles.disabled,
            ]}>
            <Share2 color={AccentColor} size={18} strokeWidth={2.4} />
            <ThemedText type="smallBold" style={styles.shareBtnText}>
              {strings.bagikanKode}
            </ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', justifyContent: 'center' },
  safeArea: { flex: 1, maxWidth: MaxContentWidth, width: '100%' },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
  },
  headerTitle: { fontSize: 22, lineHeight: 28 },
  backButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  content: { padding: Spacing.four, gap: Spacing.two },
  label: { letterSpacing: 1, fontSize: 12, marginBottom: Spacing.one },
  input: {
    borderRadius: Spacing.three,
    borderWidth: 1.5,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 8,
    textAlign: 'center',
  },
  hint: { marginTop: Spacing.two, textAlign: 'center' },
  errorText: { color: AccentColor },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    backgroundColor: AccentColor,
    paddingVertical: Spacing.three,
    borderRadius: 999,
    marginTop: Spacing.three,
  },
  primaryBtnText: { color: '#fff' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.four,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.three,
  },
  footerText: { gap: 2 },
  footerCode: { fontSize: 20, letterSpacing: 4, color: AccentColor },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 999,
    borderWidth: 1,
  },
  shareBtnText: { color: AccentColor },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
});
