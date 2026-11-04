package com.amythest.app;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.TransitionDrawable;
import android.widget.ImageView;
import java.util.WeakHashMap;

final class GeodeArt {
  private static Bitmap source;
  private static final Bitmap[] stages = new Bitmap[4];
  private static final WeakHashMap<ImageView, AnimationState> animations = new WeakHashMap<>();
  private static final class AnimationState {
    int current, target;
    Runnable pending;
    AnimationState(int stage) { current = target = stage; }
  }
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
    AnimationState state = animations.get(view);
    if (state == null) {
      view.setImageBitmap(stages[selected]);
      animations.put(view, new AnimationState(selected));
      return;
    }
    if (state.target == selected) return;
    state.target = selected;
    if (!android.animation.ValueAnimator.areAnimatorsEnabled()) {
      if (state.pending != null) view.removeCallbacks(state.pending);
      state.pending = null;
      state.current = selected;
      view.setImageBitmap(stages[selected]);
    } else if (state.pending == null) {
      animateNext(view, state);
    }
  }

  private static void animateNext(ImageView view, AnimationState state) {
    if (state.current == state.target) { state.pending = null; return; }
    int following = state.current + Integer.signum(state.target - state.current);
    // Ensure the next tile exists before constructing the crossfade drawable.
    if (stages[following] == null) {
      int width = source.getWidth() / 2, height = source.getHeight() / 2;
      stages[following] = Bitmap.createBitmap(source, (following % 2) * width,
          (following / 2) * height, width, height);
    }
    TransitionDrawable fade = new TransitionDrawable(new android.graphics.drawable.Drawable[]{
        new BitmapDrawable(view.getResources(), stages[state.current]),
        new BitmapDrawable(view.getResources(), stages[following])});
    fade.setCrossFadeEnabled(true);
    view.setImageDrawable(fade);
    fade.startTransition(240);
    state.pending = () -> {
      state.current = following;
      view.setImageBitmap(stages[following]);
      state.pending = null;
      animateNext(view, state);
    };
    view.postDelayed(state.pending, 250);
  }
}
