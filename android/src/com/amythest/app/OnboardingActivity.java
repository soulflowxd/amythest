package com.amythest.app;

import android.app.Activity;
import android.app.AppOpsManager;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.os.Process;
import android.provider.Settings;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

public final class OnboardingActivity extends Activity {
  private int step;
  private LinearLayout body;
  private final int white = Color.rgb(249, 246, 255);
  private final int soft = Color.rgb(181, 171, 197);
  private int dp(int value) { return (int)(value * getResources().getDisplayMetrics().density + .5f); }

  @Override public void onCreate(Bundle state) {
    super.onCreate(state);
    if (getSharedPreferences("amythest", 0).getBoolean("onboardingComplete", false)) { openApp(); return; }
    getWindow().setStatusBarColor(Color.rgb(5, 4, 8));
    getWindow().setNavigationBarColor(Color.rgb(5, 4, 8));
    render();
  }

  private TextView label(String value, int size, boolean bold, int color) {
    TextView text = new TextView(this);
    text.setText(value); text.setTextSize(size); text.setTextColor(color);
    if (bold) text.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
    text.setGravity(Gravity.CENTER);
    return text;
  }

  private Button button(String value, boolean primary) {
    Button button = new Button(this);
    button.setText(value); button.setTextSize(15); button.setAllCaps(false);
    button.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
    button.setTextColor(primary ? Color.rgb(26, 18, 39) : white);
    GradientDrawable background = new GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM,
        primary ? new int[]{Color.WHITE, Color.rgb(219, 202, 249)} :
            new int[]{Color.rgb(43, 36, 58), Color.rgb(24, 21, 34)});
    background.setCornerRadius(dp(22));
    background.setStroke(dp(1), primary ? Color.rgb(255, 255, 255) : Color.rgb(111, 89, 147));
    button.setBackground(background);
    return button;
  }

  private boolean hasUsageAccess() {
    AppOpsManager ops = (AppOpsManager)getSystemService(APP_OPS_SERVICE);
    return ops.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), getPackageName()) == AppOpsManager.MODE_ALLOWED;
  }

  private void render() {
    LinearLayout shell = new LinearLayout(this);
    shell.setOrientation(1); shell.setPadding(dp(28), dp(26), dp(28), dp(22));
    shell.setBackgroundColor(Color.rgb(6, 5, 10)); setContentView(shell);
    LinearLayout brand = new LinearLayout(this); brand.setGravity(Gravity.CENTER_VERTICAL);
    ImageView mark = new ImageView(this);
    mark.setImageResource(getResources().getIdentifier("icon", "drawable", getPackageName()));
    brand.addView(mark, new LinearLayout.LayoutParams(dp(28), dp(28)));
    TextView wordmark = label("amythest", 19, true, white);
    wordmark.setPadding(dp(10), 0, 0, 0);
    brand.addView(wordmark);
    shell.addView(brand);
    TextView count = label((step + 1) + " / 4", 11, true, Color.rgb(190, 151, 245));
    LinearLayout.LayoutParams countSpace = new LinearLayout.LayoutParams(-1, dp(26));
    countSpace.topMargin = dp(15); shell.addView(count, countSpace);
    body = new LinearLayout(this); body.setOrientation(1); body.setGravity(Gravity.CENTER);
    shell.addView(body, new LinearLayout.LayoutParams(-1, 0, 1));
    ImageView stone = new ImageView(this); stone.setScaleType(ImageView.ScaleType.FIT_CENTER);
    GeodeArt.show(this, stone, step);
    stone.setContentDescription(new String[]{"A closed amethyst geode", "Amethyst emerging from stone",
        "A widening amethyst geode", "A fully open amethyst geode"}[step]);
    body.addView(stone, new LinearLayout.LayoutParams(-1, dp(320)));
    String[] heads = {"Look closer.", "Make a little room.", "See your day clearly.", "Your focus, in view."};
    String[] copy = {
        "Small choices open space for what matters.",
        "Choose which apps are distractions. Their time shapes your geode against a daily budget.",
        "Usage Access measures app time. Optional Accessibility observes the app in front to send reminders; Amythest does not close other apps.",
        "Your geode changes with today's distracting app time. You can use Amythest locally without an account."
    };
    TextView headline = label(heads[step], 30, true, white);
    LinearLayout.LayoutParams headlineSpace = new LinearLayout.LayoutParams(-1, -2);
    headlineSpace.topMargin = dp(13); body.addView(headline, headlineSpace);
    TextView detail = label(copy[step], 15, false, soft);
    LinearLayout.LayoutParams detailSpace = new LinearLayout.LayoutParams(-1, -2);
    detailSpace.topMargin = dp(12); body.addView(detail, detailSpace);
    if (step == 3) {
      Button usage = button(hasUsageAccess() ? "Usage Access is on" : "Allow Usage Access", false);
      LinearLayout.LayoutParams space = new LinearLayout.LayoutParams(-1, dp(48));
      space.topMargin = dp(24); body.addView(usage, space);
      usage.setEnabled(!hasUsageAccess());
      usage.setOnClickListener(v -> startActivity(new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)));
      Button reminders = button("Optional: enable app reminders", false);
      LinearLayout.LayoutParams reminderSpace = new LinearLayout.LayoutParams(-1, dp(48));
      reminderSpace.topMargin = dp(10); body.addView(reminders, reminderSpace);
      reminders.setOnClickListener(v -> startActivity(new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)));
    }
    Button next = button(step == 3 ? "Open Amythest" : "Continue", true);
    shell.addView(next, new LinearLayout.LayoutParams(-1, dp(54)));
    next.setOnClickListener(v -> { if (step < 3) { step++; render(); } else {
      getSharedPreferences("amythest", 0).edit().putBoolean("onboardingComplete", true).apply();
      openApp();
    }});
    Button skip = button(step == 3 ? "Not now" : "Skip introduction", false);
    LinearLayout.LayoutParams skipSpace = new LinearLayout.LayoutParams(-1, dp(44));
    skipSpace.topMargin = dp(10); shell.addView(skip, skipSpace);
    skip.setOnClickListener(v -> { if (step == 3) { openAppFromSkip(); } else { step = 3; render(); } });
  }

  private void openAppFromSkip() {
    getSharedPreferences("amythest", 0).edit().putBoolean("onboardingComplete", true).apply(); openApp();
  }
  private void openApp() { startActivity(new Intent(this, MainActivity.class)); finish(); }
  @Override public void onResume() { super.onResume(); if (step == 3 && body != null) render(); }
}
