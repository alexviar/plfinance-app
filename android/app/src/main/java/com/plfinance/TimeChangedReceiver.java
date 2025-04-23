package com.plfinance;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.app.admin.DevicePolicyManager;
import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.os.Parcelable;
import android.util.Log;

import com.facebook.react.HeadlessJsTaskService;

import java.util.Calendar;
import java.util.TimeZone;

public class TimeChangedReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (Intent.ACTION_TIME_CHANGED.equals(intent.getAction())) {
            Log.d("TimeChange", "Time or Date manually changed!");

            // Obtener enrollment data desde DevicePolicyManager
            DevicePolicyManager dpm = (DevicePolicyManager) context.getSystemService(Context.DEVICE_POLICY_SERVICE);
            ComponentName adminComponent = new ComponentName(context, MyDeviceAdminReceiver.class);
            String packageName = context.getPackageName();
            Bundle restrictions = dpm.getApplicationRestrictions(adminComponent, packageName);
            if (restrictions == null) return;
            Bundle enrollmentBundle = restrictions.getBundle("enrollmentData");
            if (enrollmentBundle == null) return;

            Parcelable[] installments = enrollmentBundle.getParcelableArray("installments");
            if (installments == null) return;

            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);

            boolean shouldLockDevice = false;
            for (Parcelable p : installments) {
                Bundle installment = (Bundle) p;
                int installmentId = installment.getInt("id");
                String dueDate = installment.getString("dueDate");
                if (dueDate == null) continue;

                Intent alarmIntent = new Intent(context, InstallmentDueReceiver.class);
                alarmIntent.setAction("com.plfinance.LOCK_DEVICE");
                
                Calendar calendar = Calendar.getInstance();
                calendar.setTimeZone(TimeZone.getTimeZone("UTC"));
                try {
                    long dueTimeMillis = Long.parseLong(dueDate);
                    long currentTimeMillis = System.currentTimeMillis();
                    if (dueTimeMillis <= currentTimeMillis) {
                        Log.d("TimeChange", "Due date is in the past, starting InstallmentDueService for installment " 
                            + installmentId + " (dueTimeMillis=" + dueTimeMillis + ", currentTimeMillis=" + currentTimeMillis + ")");

                        shouldLockDevice = true;

                        continue;
                    }
                    calendar.setTimeInMillis(dueTimeMillis);
                } catch (NumberFormatException e) {
                    Log.e("TimeChange", "Invalid dueDate: " + dueDate);
                    continue;
                }

                int setFlags = PendingIntent.FLAG_UPDATE_CURRENT;
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                    setFlags |= PendingIntent.FLAG_IMMUTABLE;
                }

                PendingIntent newPendingIntent = PendingIntent.getBroadcast(
                        context,
                        installmentId,
                        alarmIntent,
                        setFlags
                );

                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                    alarmManager.setExactAndAllowWhileIdle(
                            AlarmManager.RTC_WAKEUP,
                            calendar.getTimeInMillis(),
                            newPendingIntent
                    );
                } else {
                    alarmManager.setExact(
                            AlarmManager.RTC_WAKEUP,
                            calendar.getTimeInMillis(),
                            newPendingIntent
                    );
                }
                Log.d("TimeChange", "Alarm reprogrammed for installment " + installmentId + " (dueTimeMillis=" + dueTimeMillis + ")");
            }

            if(shouldLockDevice){
                Intent serviceIntent = new Intent(context, InstallmentDueService.class);
                            context.startService(serviceIntent);
                            HeadlessJsTaskService.acquireWakeLockNow(context);
                
                Log.d("TimeChange", "Cuota vencida detectada, iniciando InstallmentDueService");
            }
        }
    }
}
