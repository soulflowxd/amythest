package com.amythest.app;

public final class GeodeLevelTest {
  static void check(boolean ok) { if (!ok) throw new AssertionError("Geode stage mismatch"); }
  public static void main(String[] args) {
    check(GeodeLevel.stage(0, 120, true) == 3);
    check(GeodeLevel.stage(36 * 60000L, 120, true) == 2);
    check(GeodeLevel.stage(78 * 60000L, 120, true) == 1);
    check(GeodeLevel.stage(120 * 60000L, 120, true) == 0);
    check(GeodeLevel.stage(999999, 120, false) == 1);
    check(GeodeLevel.stage(0, 0, true) == 1);
    System.out.println("GeodeLevel checks passed");
  }
}
