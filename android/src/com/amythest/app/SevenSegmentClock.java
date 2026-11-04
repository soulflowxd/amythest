package com.amythest.app;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.view.View;

/** A local LCD-style clock; the time is still supplied by the focus session state. */
final class SevenSegmentClock extends View {
  private static final int[] DIGITS = {63, 6, 91, 79, 102, 109, 125, 7, 127, 111};
  private final Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
  private String time = "25:00";

  SevenSegmentClock(Context context) { super(context); setContentDescription("Focus timer, 25 minutes"); }

  void setTimeText(String value) {
    if (value == null || value.equals(time)) return;
    time = value;
    setContentDescription("Focus timer, " + value);
    invalidate();
  }

  @Override protected void onDraw(Canvas canvas) {
    super.onDraw(canvas);
    float width = getWidth(), height = getHeight();
    float radius = Math.min(width, height) * .12f;
    paint.setShader(null);
    paint.setColor(Color.rgb(22, 22, 25));
    canvas.drawRoundRect(0, 0, width, height, radius, radius, paint);
    paint.setColor(Color.rgb(173, 187, 192));
    canvas.drawRoundRect(12, 12, width - 12, height - 12, radius - 5, radius - 5, paint);
    paint.setShader(null);

    float innerWidth = 192f, innerHeight = 88f;
    float scale = Math.min((width - 36f) / innerWidth, (height - 26f) / innerHeight);
    canvas.save();
    canvas.translate((width - innerWidth * scale) / 2f, (height - innerHeight * scale) / 2f);
    canvas.scale(scale, scale);
    String value = time.length() == 5 ? time : "00:00";
    float x = 0;
    for (int i = 0; i < value.length(); i++) {
      char ch = value.charAt(i);
      if (ch == ':') {
        paint.setColor(Color.rgb(10, 15, 22));
        canvas.drawRoundRect(x + 3, 25, x + 9, 31, 2, 2, paint);
        canvas.drawRoundRect(x + 3, 56, x + 9, 62, 2, 2, paint);
        x += 17;
      } else {
        int number = ch >= '0' && ch <= '9' ? ch - '0' : 0;
        drawDigit(canvas, x, DIGITS[number]);
        x += 43;
      }
    }
    canvas.restore();
  }

  private void drawDigit(Canvas canvas, float x, int mask) {
    final float[][] segments = {
      {x + 6, 3, x + 35, 9}, {x + 34, 8, x + 40, 41},
      {x + 34, 46, x + 40, 79}, {x + 6, 78, x + 35, 84},
      {x, 46, x + 6, 79}, {x, 8, x + 6, 41}, {x + 6, 40, x + 35, 46}
    };
    for (int i = 0; i < segments.length; i++) {
      paint.setColor((mask & (1 << i)) != 0 ? Color.rgb(7, 13, 22) : Color.argb(22, 7, 13, 22));
      float[] s = segments[i];
      canvas.drawRoundRect(s[0], s[1], s[2], s[3], 1.5f, 1.5f, paint);
    }
  }
}
