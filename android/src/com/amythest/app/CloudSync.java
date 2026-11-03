package com.amythest.app;
import android.content.Context;
import android.content.SharedPreferences;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Map;
import java.util.UUID;

public final class CloudSync {
  private static final String BASE="https://necessary-marlin-189.convex.cloud";
  private final SharedPreferences prefs;
  private String settingsMessage="";
  public CloudSync(Context context){prefs=context.getSharedPreferences("amythest",0);}
  public boolean signedIn(){return !prefs.getString("refreshToken","").isEmpty();}
  private JSONObject call(String kind,String path,JSONObject args,String token)throws Exception{
    URL url=new URL(BASE+"/api/"+kind);HttpURLConnection connection=(HttpURLConnection)url.openConnection();
    connection.setRequestMethod("POST");connection.setConnectTimeout(10000);connection.setReadTimeout(10000);connection.setDoOutput(true);connection.setRequestProperty("Content-Type","application/json");
    if(token!=null&&!token.isEmpty())connection.setRequestProperty("Authorization","Bearer "+token);
    JSONObject body=new JSONObject().put("path",path).put("format","json").put("args",args);
    try(OutputStream stream=connection.getOutputStream()){stream.write(body.toString().getBytes(StandardCharsets.UTF_8));}
    InputStream input=connection.getResponseCode()<400?connection.getInputStream():connection.getErrorStream();
    ByteArrayOutputStream output=new ByteArrayOutputStream();byte[] buffer=new byte[4096];int count;while((count=input.read(buffer))!=-1)output.write(buffer,0,count);
    JSONObject result=new JSONObject(output.toString("UTF-8"));connection.disconnect();
    if(!"success".equals(result.optString("status")))throw new IOException(result.optString("errorMessage","Cloud request failed"));
    return result;
  }
  public void signIn(String email,String password,boolean create)throws Exception{
    if(password.length()<8)throw new IllegalArgumentException("Use at least eight password characters.");
    JSONObject params=new JSONObject().put("email",email.trim().toLowerCase(java.util.Locale.ROOT)).put("password",password).put("flow",create?"signUp":"signIn");
    JSONObject tokens=call("action","auth:signIn",new JSONObject().put("provider","password").put("params",params),"").getJSONObject("value").getJSONObject("tokens");
    prefs.edit().putString("token",tokens.getString("token")).putString("refreshToken",tokens.getString("refreshToken")).putString("accountEmail",email.trim()).remove("androidSettingsFingerprint").remove("androidSettingsRevision").apply();
  }
  private String token()throws Exception{
    JSONObject tokens=call("action","auth:signIn",new JSONObject().put("refreshToken",prefs.getString("refreshToken","")),"").getJSONObject("value").getJSONObject("tokens");
    String token=tokens.getString("token");prefs.edit().putString("token",token).putString("refreshToken",tokens.getString("refreshToken")).apply();return token;
  }
  public JSONArray sync(String date,long activeMs,long distractionMs)throws Exception{
    String access=token();String device=prefs.getString("deviceId","");if(device.isEmpty()){device=UUID.randomUUID().toString().replace("-","");prefs.edit().putString("deviceId",device).apply();}
    JSONObject day=new JSONObject().put("deviceId",device).put("source","android").put("date",date).put("activeMs",activeMs).put("distractionMs",distractionMs).put("videoMs",0).put("sites",new JSONArray()).put("observedAt",System.currentTimeMillis());
    call("mutation","sync:putDay",day,access);
    syncSettings(access);
    return call("query","sync:getDays",new JSONObject().put("from",date).put("through",date),access).getJSONArray("value");
  }
  public String settingsMessage(){return settingsMessage;}
  private JSONObject localSettings()throws Exception{
    ArrayList<String> distractions=new ArrayList<>();ArrayList<String> limits=new ArrayList<>();
    for(Map.Entry<String,?> entry:prefs.getAll().entrySet()){
      String key=entry.getKey();if(key.startsWith("d_")&&Boolean.TRUE.equals(entry.getValue()))distractions.add(key.substring(2));
      if(key.startsWith("limit_")&&entry.getValue() instanceof Integer&&((Integer)entry.getValue())>0)limits.add(key.substring(6));
    }
    Collections.sort(distractions);Collections.sort(limits);JSONArray selected=new JSONArray();for(String app:distractions)selected.put(app);
    JSONArray appLimits=new JSONArray();for(String app:limits)appLimits.put(new JSONObject().put("app",app).put("minutes",prefs.getInt("limit_"+app,0)));
    return new JSONObject().put("goalMinutes",prefs.getInt("goal",120)).put("distractingApps",selected).put("appLimits",appLimits)
      .put("workEnabled",prefs.getBoolean("workEnabled",false)).put("workStartMinutes",prefs.getInt("workstart",540)).put("workEndMinutes",prefs.getInt("workend",1020));
  }
  private String fingerprint(JSONObject value)throws Exception{
    return value.getInt("goalMinutes")+"|"+value.getBoolean("workEnabled")+"|"+value.getInt("workStartMinutes")+"|"+value.getInt("workEndMinutes")+"|"+value.getJSONArray("distractingApps").toString()+"|"+value.getJSONArray("appLimits").toString();
  }
  private void applyRemote(JSONObject value)throws Exception{
    SharedPreferences.Editor edit=prefs.edit();for(String key:prefs.getAll().keySet())if(key.startsWith("d_")||key.startsWith("limit_"))edit.remove(key);
    edit.putInt("goal",value.getInt("goalMinutes")).putBoolean("workEnabled",value.getBoolean("workEnabled"))
      .putInt("workstart",value.getInt("workStartMinutes")).putInt("workend",value.getInt("workEndMinutes"));
    JSONArray selected=value.getJSONArray("distractingApps");for(int i=0;i<selected.length();i++)edit.putBoolean("d_"+selected.getString(i),true);
    JSONArray limits=value.getJSONArray("appLimits");for(int i=0;i<limits.length();i++){JSONObject item=limits.getJSONObject(i);edit.putInt("limit_"+item.getString("app"),item.getInt("minutes"));}edit.apply();
  }
  private void syncSettings(String access)throws Exception{
    JSONObject local=localSettings();String current=fingerprint(local);String previous=prefs.getString("androidSettingsFingerprint","");int revision=prefs.getInt("androidSettingsRevision",0);
    JSONObject remote=call("query","sync:getAndroidSettings",new JSONObject(),access).optJSONObject("value");
    if(remote==null){JSONObject saved=call("mutation","sync:putAndroidSettings",new JSONObject().put("expectedRevision",0).put("value",local),access).getJSONObject("value");revision=saved.getInt("revision");settingsMessage="Android limits uploaded";}
    else if(previous.isEmpty()||current.equals(previous)){
      applyRemote(remote);revision=remote.getInt("revision");current=fingerprint(localSettings());settingsMessage="Android limits downloaded";
    }else{
      if(remote.getInt("revision")!=revision)throw new IOException("Android limits changed on another device. Sign out and back in to use the cloud version.");
      JSONObject saved=call("mutation","sync:putAndroidSettings",new JSONObject().put("expectedRevision",revision).put("value",local),access).getJSONObject("value");revision=saved.getInt("revision");settingsMessage="Android limits uploaded";
    }
    prefs.edit().putInt("androidSettingsRevision",revision).putString("androidSettingsFingerprint",current).apply();
  }
  public void signOut(){prefs.edit().remove("token").remove("refreshToken").remove("accountEmail").remove("androidSettingsFingerprint").remove("androidSettingsRevision").apply();}
}
