import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useThemedStyles } from '../theme/ThemeContext';
import { signUp, logIn, logOut, loadAccount, sendResetCode, resetPassword, deleteAccount } from '../services/accountService';
import { backupNow, fetchRestore, deleteBackup, getBackupStatus, setAutoBackup, apiUrl } from '../services/cloudService';
import { isStoreReady, premiumPlans, buyPlan, restorePurchases, manageSubscription } from '../services/premiumService';

const when = (iso) => {
  if (!iso) return 'Never';
  const d = new Date(iso);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};
const day = (iso) => (iso ? new Date(iso).toLocaleDateString() : '');
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const BENEFITS = [
  ['cloud-upload-outline', 'Back up your playlists, loved songs and the lyrics you typed'],
  ['phone-portrait-outline', 'Get them back on a new phone: just log in'],
  ['time-outline', 'Automatic backup once a day'],
  ['heart-outline', 'Support Selah and keep it free of ads']
];

function Field({ styles, c, ...props }) {
  return <TextInput style={styles.input} placeholderTextColor={c.textSubtle} autoCorrect={false} {...props} />;
}

/**
 * Account & Backup: log in / sign up / forgot password when logged out;
 * Premium, backup & restore, log out and delete account when logged in.
 * account = { user, premium } or null. onAccountChange(next) updates the app.
 */
export default function AccountModal({ visible, onClose, account, onAccountChange, getState, onRestore }) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const [mode, setMode] = useState('login'); // login | signup | forgot | reset
  const [view, setView] = useState('home'); // home | premium | delete (when logged in)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null);
  const [status, setStatus] = useState({ lastBackupAt: null, auto: false });
  const [plans, setPlans] = useState(null); // null = not loaded, [] = none
  const [plansNote, setPlansNote] = useState('');

  useEffect(() => {
    if (!visible) return;
    setError('');
    setView('home');
    setPassword('');
    setCode('');
    getBackupStatus().then(setStatus);
  }, [visible]);

  if (!visible) return null;

  const premium = account && account.premium && account.premium.active;
  const run = async (key, fn) => {
    setBusy(key);
    setError('');
    try {
      await fn();
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(null);
    }
  };

  const refresh = async () => {
    const next = await loadAccount();
    onAccountChange(next);
    return next;
  };

  // ── Logged out ────────────────────────────────────────────────────────────
  const submitAuth = () =>
    run('auth', async () => {
      if (mode === 'signup') await signUp({ name, email, password });
      else if (mode === 'login') await logIn({ email, password });
      else if (mode === 'forgot') {
        await sendResetCode(email);
        setMode('reset');
        Alert.alert('Check your email', `We sent a 6-digit code to ${email.trim()}. It works for 10 minutes.`);
        return;
      } else {
        await resetPassword({ email, code, password });
        await logIn({ email, password });
      }
      setPassword('');
      setCode('');
      await refresh();
    });

  const renderAuth = () => {
    const titles = { login: 'Log in', signup: 'Create your account', forgot: 'Forgot password', reset: 'Set a new password' };
    const buttons = { login: 'Log in', signup: 'Create account', forgot: 'Send me a code', reset: 'Save new password' };
    return (
      <>
        <Text style={styles.heading}>{titles[mode]}</Text>
        {mode === 'login' || mode === 'signup' ? (
          <Text style={styles.note}>
            A free account lets you share lyrics with other Selah users. With Selah Premium, your playlists and lyrics are
            backed up and come back on a new phone.
          </Text>
        ) : (
          <Text style={styles.note}>
            {mode === 'forgot'
              ? "Enter your account's email. We'll send you a 6-digit code."
              : 'Enter the code from the email and choose a new password.'}
          </Text>
        )}

        {mode === 'signup' && (
          <Field styles={styles} c={c} value={name} onChangeText={setName} placeholder="Your name" autoCapitalize="words" testID="account-name" />
        )}
        <Field
          styles={styles}
          c={c}
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
          editable={mode !== 'reset'}
          testID="account-email"
        />
        {mode === 'reset' && (
          <Field styles={styles} c={c} value={code} onChangeText={setCode} placeholder="6-digit code" keyboardType="number-pad" maxLength={6} testID="account-code" />
        )}
        {mode !== 'forgot' && (
          <Field
            styles={styles}
            c={c}
            value={password}
            onChangeText={setPassword}
            placeholder={mode === 'reset' ? 'New password (8+ characters)' : mode === 'signup' ? 'Password (8+ characters)' : 'Password'}
            secureTextEntry
            autoCapitalize="none"
            textContentType={mode === 'login' ? 'password' : 'newPassword'}
            testID="account-password"
          />
        )}

        {error ? <Text style={styles.error} testID="account-error">{error}</Text> : null}

        <TouchableOpacity style={styles.primaryBtn} onPress={submitAuth} disabled={Boolean(busy)} testID="account-submit">
          {busy === 'auth' ? <ActivityIndicator color="#FFFFFF" /> : null}
          <Text style={styles.primaryText}>{buttons[mode]}</Text>
        </TouchableOpacity>

        <View style={styles.linksRow}>
          {mode === 'login' && (
            <>
              <TouchableOpacity onPress={() => { setMode('signup'); setError(''); }} testID="go-signup">
                <Text style={styles.link}>New here? Create an account</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setMode('forgot'); setError(''); }} testID="go-forgot">
                <Text style={styles.link}>Forgot password?</Text>
              </TouchableOpacity>
            </>
          )}
          {mode !== 'login' && (
            <TouchableOpacity onPress={() => { setMode('login'); setError(''); }} testID="go-login">
              <Text style={styles.link}>{mode === 'signup' ? 'Have an account? Log in' : 'Back to log in'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </>
    );
  };

  // ── Logged in: home ───────────────────────────────────────────────────────
  const doBackup = () =>
    run('backup', async () => {
      const result = await backupNow(getState());
      setStatus((s) => ({ ...s, lastBackupAt: result.savedAt }));
      Alert.alert('Backed up', `${result.playlists} playlist${result.playlists === 1 ? '' : 's'} and ${result.songs} song${result.songs === 1 ? '' : 's'} are saved in your account.`);
    });

  const doRestore = () =>
    run('restore', async () => {
      const result = await fetchRestore(getState().tracks);
      await onRestore(result);
      const missing = result.total - result.found;
      Alert.alert(
        'Restored',
        `${result.playlists.length} playlist${result.playlists.length === 1 ? '' : 's'} and ${result.favorites.length} loved song${
          result.favorites.length === 1 ? '' : 's'
        } are back.${missing > 0 ? ` ${missing} song${missing === 1 ? ' is' : 's are'} not on this phone yet, so ${missing === 1 ? 'it was' : 'they were'} skipped.` : ''}`
      );
    });

  const confirmDeleteBackup = () =>
    Alert.alert('Delete your backup?', 'The backup in your account will be removed. Songs and playlists on this phone stay.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          run('delete-backup', async () => {
            await deleteBackup();
            setStatus((s) => ({ ...s, lastBackupAt: null }));
          })
      }
    ]);

  const toggleAuto = async (on) => {
    setStatus((s) => ({ ...s, auto: on }));
    await setAutoBackup(on);
  };

  const doLogOut = () =>
    run('logout', async () => {
      await logOut();
      onAccountChange(null);
      setMode('login');
    });

  const premiumLine = () => {
    const p = account.premium || {};
    if (p.source === 'gift') return p.until ? `Gifted until ${day(p.until)}` : 'Gifted to you';
    if (p.source === 'open') return 'Free while Selah is being tested';
    return p.until ? `Renews or ends on ${day(p.until)}` : 'Active';
  };

  const renderHome = () => (
    <>
      <View style={styles.profile}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{String(account.user.name || account.user.email || '?').trim().charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.profileName} numberOfLines={1}>{account.user.name}</Text>
          <Text style={styles.small} numberOfLines={1} testID="account-signed-in-email">{account.user.email}</Text>
        </View>
      </View>

      <View style={[styles.box, premium && styles.premiumBox]} testID="premium-card">
        <View style={styles.rowCenter}>
          <Ionicons name={premium ? 'star' : 'star-outline'} size={18} color={premium ? '#F59E0B' : c.ink} />
          <Text style={styles.boxTitle}>Selah Premium</Text>
          {premium ? <Text style={styles.badge}>ACTIVE</Text> : null}
        </View>
        {premium ? (
          <>
            <Text style={styles.small}>{premiumLine()}</Text>
            {account.premium.source === 'store' && (
              <TouchableOpacity onPress={manageSubscription}>
                <Text style={styles.link}>Manage or cancel your subscription</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <>
            <Text style={styles.small}>Back up your playlists and lyrics, and get them back on any phone.</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={openPremium} testID="see-plans">
              <Text style={styles.primaryText}>See Premium plans</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={[styles.box, !premium && styles.locked]} testID="backup-card">
        <View style={styles.rowCenter}>
          <Ionicons name={premium ? 'cloud-done-outline' : 'lock-closed-outline'} size={18} color={c.ink} />
          <Text style={styles.boxTitle}>Backup</Text>
        </View>
        {premium ? (
          <>
            <Text style={styles.small}>Your songs themselves are never uploaded, only your lists and lyrics.</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={doBackup} disabled={Boolean(busy)} testID="backup-now">
              {busy === 'backup' ? <ActivityIndicator color="#FFFFFF" /> : <Ionicons name="cloud-upload" size={18} color="#FFFFFF" />}
              <Text style={styles.primaryText}>Back up now</Text>
            </TouchableOpacity>
            <Text style={styles.small} testID="backup-last">Last backup: {when(status.lastBackupAt)}</Text>
            <TouchableOpacity style={styles.secondaryBtn} onPress={doRestore} disabled={Boolean(busy)} testID="restore-now">
              {busy === 'restore' ? <ActivityIndicator color={c.ink} /> : <Ionicons name="cloud-download-outline" size={18} color={c.ink} />}
              <Text style={styles.secondaryText}>Restore my backup</Text>
            </TouchableOpacity>
            <View style={styles.rowCenter}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>Back up automatically</Text>
                <Text style={styles.small}>Once a day, when you leave the app</Text>
              </View>
              <Switch value={status.auto} onValueChange={toggleAuto} testID="backup-auto" />
            </View>
            <TouchableOpacity onPress={confirmDeleteBackup} testID="backup-delete">
              <Text style={styles.dangerLink}>Delete my backup</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.small}>Backup and restore are part of Selah Premium.</Text>
        )}
      </View>

      {error ? <Text style={styles.error} testID="account-error">{error}</Text> : null}

      <TouchableOpacity style={styles.secondaryBtn} onPress={doLogOut} disabled={Boolean(busy)} testID="account-logout">
        <Ionicons name="log-out-outline" size={18} color={c.ink} />
        <Text style={styles.secondaryText}>Log out</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => { setView('delete'); setPassword(''); setError(''); }} testID="go-delete-account">
        <Text style={styles.dangerLink}>Delete my account</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => Linking.openURL(`${apiUrl()}/privacy`).catch(() => {})}>
        <Text style={styles.footLink}>Privacy policy</Text>
      </TouchableOpacity>
    </>
  );

  // ── Logged in: Premium plans ──────────────────────────────────────────────
  function openPremium() {
    setView('premium');
    setError('');
    setPlans(null);
    setPlansNote('');
    if (!isStoreReady()) {
      setPlans([]);
      setPlansNote("Selah Premium isn't on sale yet. It's coming soon.");
      return;
    }
    premiumPlans()
      .then((list) => {
        setPlans(list);
        if (list.length === 0) setPlansNote('No plans are available right now. Please try again later.');
      })
      .catch(() => {
        setPlans([]);
        setPlansNote('Premium can be bought in the Selah app installed from Google Play.');
      });
  }

  const afterPurchase = async () => {
    // the store tells Selah's server within a few seconds
    for (let i = 0; i < 4; i++) {
      const next = await refresh();
      if (next && next.premium && next.premium.active) {
        setView('home');
        Alert.alert('Welcome to Selah Premium', 'Thank you! You can back up your playlists and lyrics now.');
        return;
      }
      await wait(1500);
    }
    Alert.alert('Almost there', 'Your purchase went through. Premium will show here in a moment; reopen this screen if it does not.');
  };

  const doBuy = (plan) =>
    run(`buy-${plan.id}`, async () => {
      if (await buyPlan(plan)) await afterPurchase();
    });

  const doRestorePurchases = () =>
    run('restore-purchases', async () => {
      await restorePurchases();
      const next = await refresh();
      if (next && next.premium && next.premium.active) setView('home');
      else Alert.alert('Nothing to restore', 'No Premium subscription was found for this Google Play account.');
    });

  const renderPremium = () => (
    <>
      <TouchableOpacity style={styles.back} onPress={() => setView('home')} testID="premium-back">
        <Ionicons name="arrow-back" size={18} color={c.ink} />
        <Text style={styles.secondaryText}>Account</Text>
      </TouchableOpacity>
      <Text style={styles.heading}>Selah Premium</Text>
      {BENEFITS.map(([icon, text]) => (
        <View key={text} style={styles.benefit}>
          <Ionicons name={icon} size={18} color={c.ink} />
          <Text style={styles.benefitText}>{text}</Text>
        </View>
      ))}

      {plans === null ? <ActivityIndicator color={c.ink} style={{ marginVertical: 16 }} /> : null}
      {(plans || []).map((plan) => (
        <TouchableOpacity
          key={plan.id}
          style={styles.plan}
          onPress={() => doBuy(plan)}
          disabled={Boolean(busy)}
          testID={`plan-${plan.id}`}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.planTitle}>{plan.title}</Text>
            <Text style={styles.small}>{plan.price} {plan.period}</Text>
          </View>
          {busy === `buy-${plan.id}` ? <ActivityIndicator color={c.ink} /> : <Text style={styles.planBuy}>Choose</Text>}
        </TouchableOpacity>
      ))}
      {plansNote ? <Text style={styles.note} testID="plans-note">{plansNote}</Text> : null}
      {error ? <Text style={styles.error} testID="account-error">{error}</Text> : null}

      {isStoreReady() && (
        <TouchableOpacity onPress={doRestorePurchases} disabled={Boolean(busy)} testID="restore-purchases">
          <Text style={styles.link}>Already paid? Restore purchases</Text>
        </TouchableOpacity>
      )}
      <Text style={styles.fine}>
        Payment is charged to your {Platform.OS === 'ios' ? 'Apple ID' : 'Google Play account'}. The subscription renews
        automatically unless you cancel at least 24 hours before the end of the period. You can manage or cancel it any
        time in {Platform.OS === 'ios' ? 'your App Store settings' : 'Google Play'}.
      </Text>
    </>
  );

  // ── Logged in: delete account ─────────────────────────────────────────────
  const doDeleteAccount = () =>
    run('delete-account', async () => {
      await deleteAccount(password);
      setPassword('');
      onAccountChange(null);
      setMode('login');
      setView('home');
      Alert.alert('Account deleted', 'Your account, backup and shared lyrics have been deleted.');
    });

  const renderDelete = () => (
    <>
      <TouchableOpacity style={styles.back} onPress={() => setView('home')}>
        <Ionicons name="arrow-back" size={18} color={c.ink} />
        <Text style={styles.secondaryText}>Account</Text>
      </TouchableOpacity>
      <Text style={styles.heading}>Delete your account</Text>
      <Text style={styles.note}>
        This deletes your account, your backup and the lyrics you shared. It can't be undone. Songs on this phone are not
        touched.
      </Text>
      {premium && account.premium.source === 'store' ? (
        <Text style={styles.warn}>
          Deleting your account does not cancel Selah Premium. Cancel it in {Platform.OS === 'ios' ? 'the App Store' : 'Google Play'} first.
        </Text>
      ) : null}
      <Field
        styles={styles}
        c={c}
        value={password}
        onChangeText={setPassword}
        placeholder="Your password"
        secureTextEntry
        autoCapitalize="none"
        testID="delete-password"
      />
      {error ? <Text style={styles.error} testID="account-error">{error}</Text> : null}
      <TouchableOpacity style={styles.dangerBtn} onPress={doDeleteAccount} disabled={Boolean(busy)} testID="delete-account-confirm">
        {busy === 'delete-account' ? <ActivityIndicator color="#FFFFFF" /> : null}
        <Text style={styles.primaryText}>Delete my account forever</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
        <View style={styles.sheet} testID="account-modal">
          <View style={styles.header}>
            <Text style={styles.title}>Account &amp; Backup</Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Close" testID="account-close">
              <Ionicons name="close" size={24} color={c.text} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 16 }} keyboardShouldPersistTaps="handled">
            {!account ? renderAuth() : view === 'premium' ? renderPremium() : view === 'delete' ? renderDelete() : renderHome()}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(8, 9, 12, 0.6)', justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 18,
      paddingBottom: 30,
      maxHeight: '94%'
    },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    title: { color: c.text, fontSize: 19, fontWeight: '900' },
    heading: { color: c.text, fontSize: 18, fontWeight: '900' },
    note: { color: c.textSecondary, fontSize: 14, lineHeight: 20 },
    small: { color: c.textMuted, fontSize: 12, lineHeight: 17 },
    fine: { color: c.textSubtle, fontSize: 11, lineHeight: 16 },
    error: { color: '#EF4444', fontSize: 13, fontWeight: '700' },
    warn: { color: c.warnText, backgroundColor: c.warnBg, borderColor: c.warnBorder, borderWidth: 1, borderRadius: 12, padding: 10, fontSize: 13 },
    input: {
      backgroundColor: c.surfaceAlt,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: 12,
      paddingVertical: 11,
      color: c.text,
      fontSize: 15
    },
    primaryBtn: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.inverse,
      borderRadius: 14,
      paddingVertical: 13
    },
    primaryText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
    secondaryBtn: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surfaceAlt,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      paddingVertical: 12
    },
    secondaryText: { color: c.ink, fontWeight: '800', fontSize: 14 },
    dangerBtn: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#DC2626',
      borderRadius: 14,
      paddingVertical: 13
    },
    linksRow: { gap: 10, alignItems: 'center', marginTop: 4 },
    link: { color: c.ink, fontWeight: '800', fontSize: 13, textDecorationLine: 'underline' },
    dangerLink: { color: '#EF4444', fontWeight: '800', fontSize: 13, textAlign: 'center', paddingVertical: 6 },
    footLink: { color: c.textMuted, fontSize: 12, textAlign: 'center', textDecorationLine: 'underline' },
    profile: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: c.inverse, alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: '#FFFFFF', fontWeight: '900', fontSize: 18 },
    profileName: { color: c.text, fontWeight: '900', fontSize: 16 },
    box: { backgroundColor: c.surfaceAlt, borderRadius: 16, borderWidth: 1, borderColor: c.border, padding: 14, gap: 10 },
    premiumBox: { borderColor: '#F59E0B' },
    locked: { opacity: 0.85 },
    rowCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    boxTitle: { color: c.text, fontWeight: '900', fontSize: 15, flex: 1 },
    badge: { color: '#FFFFFF', backgroundColor: '#F59E0B', fontSize: 10, fontWeight: '900', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, overflow: 'hidden' },
    rowTitle: { color: c.text, fontWeight: '800', fontSize: 14 },
    back: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    benefit: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    benefitText: { color: c.text, fontSize: 14, flex: 1 },
    plan: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surfaceAlt,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      padding: 14
    },
    planTitle: { color: c.text, fontWeight: '900', fontSize: 15 },
    planBuy: { color: c.ink, fontWeight: '900', fontSize: 14 }
  });
