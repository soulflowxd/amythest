package com.amythest.app;

import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.util.Arrays;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

/** Keeps the account refresh token encrypted with an app-specific Android Keystore key. */
final class TokenVault {
  private static final String ALIAS = "amythest.account.refresh.v1";
  private static final String ENCRYPTED = "secureRefreshToken";
  private final SharedPreferences prefs;

  TokenVault(Context context) {
    prefs = context.getSharedPreferences("amythest", Context.MODE_PRIVATE);
    migrateLegacyToken();
  }

  boolean hasToken() { return prefs.contains(ENCRYPTED); }

  void clear() {
    prefs.edit().remove(ENCRYPTED).remove("refreshToken").remove("token").commit();
  }

  void store(String token) throws Exception {
    String encoded = encrypt(token);
    if (!prefs.edit().putString(ENCRYPTED, encoded).remove("refreshToken").remove("token").commit())
      throw new IOException("Could not save sign-in securely.");
  }

  String read() throws Exception {
    String encoded = prefs.getString(ENCRYPTED, "");
    if (encoded.isEmpty()) throw new IOException("Sign in to sync this device.");
    try {
      byte[] packed = Base64.decode(encoded, Base64.NO_WRAP);
      if (packed.length < 29 || packed[0] != 1) throw new IOException("Invalid token format");
      byte[] iv = Arrays.copyOfRange(packed, 1, 13);
      byte[] ciphertext = Arrays.copyOfRange(packed, 13, packed.length);
      Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
      cipher.init(Cipher.DECRYPT_MODE, key(), new GCMParameterSpec(128, iv));
      return new String(cipher.doFinal(ciphertext), StandardCharsets.UTF_8);
    } catch (Exception error) {
      throw new IOException("Saved sign-in cannot be opened. Sign out and sign in again.");
    }
  }

  private void migrateLegacyToken() {
    String legacy = prefs.getString("refreshToken", "");
    if (legacy.isEmpty()) { prefs.edit().remove("token").commit(); return; }
    try { store(legacy); }
    catch (Exception error) { clear(); }
  }

  private String encrypt(String token) throws Exception {
    Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
    cipher.init(Cipher.ENCRYPT_MODE, key());
    byte[] iv = cipher.getIV();
    if (iv.length != 12) throw new IOException("Unexpected encryption IV size");
    byte[] ciphertext = cipher.doFinal(token.getBytes(StandardCharsets.UTF_8));
    byte[] packed = new byte[1 + iv.length + ciphertext.length];
    packed[0] = 1;
    System.arraycopy(iv, 0, packed, 1, iv.length);
    System.arraycopy(ciphertext, 0, packed, 1 + iv.length, ciphertext.length);
    return Base64.encodeToString(packed, Base64.NO_WRAP);
  }

  private SecretKey key() throws Exception {
    KeyStore store = KeyStore.getInstance("AndroidKeyStore");
    store.load(null);
    if (store.containsAlias(ALIAS)) return (SecretKey) store.getKey(ALIAS, null);
    KeyGenerator generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
    generator.init(new KeyGenParameterSpec.Builder(ALIAS,
      KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
      .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
      .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
      .setKeySize(256).build());
    return generator.generateKey();
  }
}
