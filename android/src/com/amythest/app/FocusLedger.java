package com.amythest.app;

import android.content.SharedPreferences;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;

/** Local, data-backed progress. No score, streak, or reward is granted for an unfinished timer. */
final class FocusLedger {
  private FocusLedger() {}

  static String day(long when) {
    return new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date(when));
  }

  static void start(SharedPreferences prefs, long now, int minutes, boolean hard) {
    long until = now + minutes * 60000L;
    prefs.edit().putLong("focusStartedAt", now).putLong("focusUntil", until)
      .putLong("hardModeUntil", hard ? until : 0).apply();
  }

  static void stop(SharedPreferences prefs) {
    prefs.edit().remove("focusStartedAt").putLong("focusUntil", 0)
      .putLong("hardModeUntil", 0).apply();
  }

  static void settle(SharedPreferences prefs, long now) {
    long started = prefs.getLong("focusStartedAt", 0);
    long until = prefs.getLong("focusUntil", 0);
    if (started <= 0 || until <= started || now < until) return;
    int minutes = (int) Math.max(1, Math.min(180, (until - started) / 60000L));
    String date = day(until);
    prefs.edit().putInt("focusMinutes:" + date, prefs.getInt("focusMinutes:" + date, 0) + minutes)
      .putInt("focusSessions:" + date, prefs.getInt("focusSessions:" + date, 0) + 1)
      .putInt("focusPoints", prefs.getInt("focusPoints", 0) + minutes)
      .remove("focusStartedAt").putLong("focusUntil", 0).putLong("hardModeUntil", 0).commit();
  }

  static int minutesToday(SharedPreferences prefs) {
    return prefs.getInt("focusMinutes:" + day(System.currentTimeMillis()), 0);
  }

  static int completedToday(SharedPreferences prefs) {
    return prefs.getInt("focusSessions:" + day(System.currentTimeMillis()), 0);
  }

  static int streak(SharedPreferences prefs) {
    Calendar date = Calendar.getInstance();
    if (prefs.getInt("focusSessions:" + day(date.getTimeInMillis()), 0) == 0)
      date.add(Calendar.DAY_OF_YEAR, -1);
    int count = 0;
    for (int i = 0; i < 365; i++) {
      if (prefs.getInt("focusSessions:" + day(date.getTimeInMillis()), 0) <= 0) break;
      count++;
      date.add(Calendar.DAY_OF_YEAR, -1);
    }
    return count;
  }

  static int totalFocusMinutes(SharedPreferences prefs) {
    int sum = 0;
    for (String key : prefs.getAll().keySet())
      if (key.startsWith("focusMinutes:")) sum += prefs.getInt(key, 0);
    return sum;
  }

}
