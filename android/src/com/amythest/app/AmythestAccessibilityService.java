package com.amythest.app;
import android.accessibilityservice.AccessibilityService;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.view.accessibility.AccessibilityEvent;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Locale;
import java.util.Map;

public class AmythestAccessibilityService extends AccessibilityService {
  private static final String CHANNEL="focus-reminders";
  @Override public void onAccessibilityEvent(AccessibilityEvent event) {
    if(event==null || event.getEventType()!=AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED || event.getPackageName()==null)return;
    String app=event.getPackageName().toString();
    SharedPreferences prefs=getSharedPreferences("amythest",0);
    prefs.edit().putString("lastForegroundPackage",app).apply();
    if(app.equals(getPackageName()))return;
    long now=System.currentTimeMillis();
    Calendar calendar=Calendar.getInstance();calendar.set(Calendar.HOUR_OF_DAY,0);calendar.set(Calendar.MINUTE,0);calendar.set(Calendar.SECOND,0);calendar.set(Calendar.MILLISECOND,0);
    String day=new SimpleDateFormat("yyyy-MM-dd",Locale.US).format(calendar.getTime());
    boolean selectedDistraction=prefs.getBoolean("d_"+app,false);
    boolean focus=selectedDistraction&&prefs.getLong("focusUntil",0)>now;
    int weekday=calendar.get(Calendar.DAY_OF_WEEK);
    int minuteOfDay=Calendar.getInstance().get(Calendar.HOUR_OF_DAY)*60+Calendar.getInstance().get(Calendar.MINUTE);
    int workStart=prefs.getInt("workstart",540),workEnd=prefs.getInt("workend",1020);
    boolean todayWeekday=weekday>=Calendar.MONDAY&&weekday<=Calendar.FRIDAY;
    int previousDay=weekday==Calendar.SUNDAY?Calendar.SATURDAY:weekday-1;
    boolean previousWeekday=previousDay>=Calendar.MONDAY&&previousDay<=Calendar.FRIDAY;
    boolean inWorkHours=workStart<workEnd?todayWeekday&&minuteOfDay>=workStart&&minuteOfDay<workEnd:
      workStart>workEnd&&((todayWeekday&&minuteOfDay>=workStart)||(previousWeekday&&minuteOfDay<workEnd));
    boolean work=selectedDistraction&&prefs.getBoolean("workEnabled",false)&&inWorkHours;
    boolean limit=false, appLimit=false;
    try {
      UsageStatsManager manager=(UsageStatsManager)getSystemService(USAGE_STATS_SERVICE);
      Map<String,UsageStats> rows=manager.queryAndAggregateUsageStats(calendar.getTimeInMillis(),now);
      long distraction=0;
      if(rows!=null)for(Map.Entry<String,UsageStats> row:rows.entrySet())if(prefs.getBoolean("d_"+row.getKey(),false))distraction+=row.getValue().getTotalTimeInForeground();
      limit=distraction>=prefs.getInt("goal",120)*60000L&&selectedDistraction;
      int appMinutes=prefs.getInt("limit_"+app,0);
      appLimit=appMinutes>0&&rows!=null&&rows.containsKey(app)&&rows.get(app).getTotalTimeInForeground()>=appMinutes*60000L;
    }catch(Exception ignored){}
    if(!focus&&!limit&&!appLimit&&!work)return;
    String reminderKey="reminded_"+(focus?"focus_"+prefs.getLong("focusUntil",0):appLimit?"app_"+day:work?"work_"+day:"goal_"+day)+"_"+app;
    if(prefs.getBoolean(reminderKey,false))return;
    NotificationManager notifications=(NotificationManager)getSystemService(Context.NOTIFICATION_SERVICE);
    if(Build.VERSION.SDK_INT>=26)notifications.createNotificationChannel(new NotificationChannel(CHANNEL,"Focus reminders",NotificationManager.IMPORTANCE_DEFAULT));
    Intent open=new Intent(this,MainActivity.class);
    PendingIntent pending=PendingIntent.getActivity(this,0,open,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
    Notification notification=new Notification.Builder(this,CHANNEL).setSmallIcon(getApplicationInfo().icon).setContentTitle("Time to hop off this app")
      .setContentText(focus?"You're in a focus session. Take a moment before continuing.":appLimit?"You've reached this app's daily limit.":work?"It's within your work hours. Leave this distraction for later.":"You've reached today's distraction goal. Take a break.")
      .setContentIntent(pending).setAutoCancel(true).build();
    try{notifications.notify(app.hashCode(),notification);prefs.edit().putBoolean(reminderKey,true).apply();}catch(SecurityException ignored){}
  }
  @Override public void onInterrupt() {}
}
