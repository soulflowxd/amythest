package com.amythest.app;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.widget.ImageView;

final class GeodeArt {
  private static Bitmap source;
  private static final Bitmap[] stages = new Bitmap[4];
  private GeodeArt() {}

  static void show(Context context, ImageView view, int stage) {
    int selected = Math.max(0, Math.min(3, stage));
    if (source == null) source = BitmapFactory.decodeResource(context.getResources(),
        context.getResources().getIdentifier("amythest_geode_stages", "drawable", context.getPackageName()));
    if (source == null) return;
    if (stages[selected] == null) {
      int width = source.getWidth() / 2, height = source.getHeight() / 2;
      stages[selected] = Bitmap.createBitmap(source, (selected % 2) * width,
          (selected / 2) * height, width, height);
    }
    view.setImageBitmap(stages[selected]);
  }
}
