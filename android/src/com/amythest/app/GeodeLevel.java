package com.amythest.app;

final class GeodeLevel {
  private GeodeLevel() {}

  // The image is a reflection of the chosen distraction budget, not a wellness score.
  static int stage(long distractionMs, int goalMinutes, boolean usageKnown) {
    if (!usageKnown || goalMinutes <= 0) return 1;
    double fraction = (double)Math.max(0, distractionMs) / (goalMinutes * 60000.0);
    if (fraction >= 1.0) return 0;
    if (fraction >= .65) return 1;
    if (fraction >= .30) return 2;
    return 3;
  }

  static String label(int stage, boolean usageKnown) {
    if (!usageKnown) return "Allow Usage Access to see your geode";
    switch (stage) {
      case 0: return "Budget reached · geode resting";
      case 1: return "Near your distraction budget";
      case 2: return "Room to focus today";
      default: return "Your geode is open";
    }
  }
}
