package com.amythest.app;

import android.content.SharedPreferences;
import java.lang.reflect.Proxy;
import java.util.HashMap;
import java.util.Map;

/** Run on a local JDK with android.jar; no device data or account is involved. */
public final class FocusLedgerTest {
  private static SharedPreferences memoryPrefs() {
    Map<String, Object> data = new HashMap<>();
    SharedPreferences.Editor editor = (SharedPreferences.Editor) Proxy.newProxyInstance(
      FocusLedgerTest.class.getClassLoader(), new Class<?>[]{SharedPreferences.Editor.class},
      (proxy, method, args) -> {
        String name = method.getName();
        if (name.startsWith("put")) { data.put((String) args[0], args[1]); return proxy; }
        if (name.equals("remove")) { data.remove(args[0]); return proxy; }
        if (name.equals("clear")) { data.clear(); return proxy; }
        if (name.equals("commit")) return true;
        return null;
      });
    return (SharedPreferences) Proxy.newProxyInstance(
      FocusLedgerTest.class.getClassLoader(), new Class<?>[]{SharedPreferences.class},
      (proxy, method, args) -> {
        String name = method.getName();
        if (name.equals("edit")) return editor;
        if (name.equals("getAll")) return data;
        if (name.equals("contains")) return data.containsKey(args[0]);
        if (name.startsWith("get")) return data.getOrDefault(args[0], args[1]);
        return null;
      });
  }

  private static void check(boolean condition, String message) {
    if (!condition) throw new AssertionError(message);
  }

  public static void main(String[] args) {
    SharedPreferences prefs = memoryPrefs();
    long now = System.currentTimeMillis();
    FocusLedger.start(prefs, now, 5, true);
    check(prefs.getLong("hardModeUntil", 0) == now + 300000L, "Hard Mode deadline");
    FocusLedger.settle(prefs, now + 299999L);
    check(prefs.getInt("focusPoints", 0) == 0, "unfinished timer earned points");
    FocusLedger.settle(prefs, now + 300000L);
    check(prefs.getInt("focusPoints", 0) == 5, "completed timer earned wrong points");
    check(prefs.getInt("focusSessions:" + FocusLedger.day(now + 300000L), 0) == 1,
      "completed timer was not recorded");
    FocusLedger.settle(prefs, now + 400000L);
    check(prefs.getInt("focusPoints", 0) == 5, "timer was recorded twice");
    FocusLedger.start(prefs, now + 500000L, 5, false);
    FocusLedger.stop(prefs);
    FocusLedger.settle(prefs, now + 900000L);
    check(prefs.getInt("focusPoints", 0) == 5, "early stop earned points");
    System.out.println("FocusLedger checks passed");
  }
}
