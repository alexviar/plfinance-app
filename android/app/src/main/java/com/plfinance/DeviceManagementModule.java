package com.plfinance;

import android.app.Activity;
import android.app.AlarmManager;
import android.app.KeyguardManager;
import android.app.PendingIntent;
import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.UserManager;
import android.provider.Settings;
import android.util.Log;
import android.os.Bundle;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import java.lang.SuppressWarnings;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Calendar;
import java.util.TimeZone;

public class DeviceManagementModule extends ReactContextBaseJavaModule {
    private static final String TAG = "DeviceManagementModule";
    private final ReactApplicationContext reactContext;
    private DevicePolicyManager devicePolicyManager;
    private ComponentName adminComponent;

    public DeviceManagementModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        this.devicePolicyManager = (DevicePolicyManager) reactContext.getSystemService(Context.DEVICE_POLICY_SERVICE);
        this.adminComponent = new ComponentName(reactContext, MyDeviceAdminReceiver.class);
    }

    @NonNull
    @Override
    public String getName() {
        return "DeviceManagement";
    }

    public static final String EXTRA_LOCK_TASK = "lock_task_mode";

    @ReactMethod
    public void lock() {
        String packageName = getReactApplicationContext().getPackageName();
        if (devicePolicyManager.isDeviceOwnerApp(packageName)) {
            String[] packages = new String[] { packageName };
            devicePolicyManager.setLockTaskPackages(adminComponent, packages);

            Intent intent = new Intent(reactContext, MainActivity.class);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            intent.putExtra(EXTRA_LOCK_TASK, true);
            reactContext.startActivity(intent);
        } else {
            Log.e(TAG, "La app no es propietaria del dispositivo");
        }
    }

    @ReactMethod
    public void unlock() {
        Activity currentActivity = getCurrentActivity();
        if (currentActivity != null) {
            currentActivity.stopLockTask();
            currentActivity.finish();
        } else {
            Log.e(TAG, "La app no está en primer plano");
        }
    }

    @ReactMethod
    @SuppressWarnings("deprecation")
    public void release() {
        try {
            if (devicePolicyManager.isDeviceOwnerApp(reactContext.getPackageName())) {
                devicePolicyManager.clearDeviceOwnerApp(reactContext.getPackageName());
                Log.d(TAG, "Device owner eliminado correctamente");
            }

            if (devicePolicyManager.isAdminActive(adminComponent)) {
                devicePolicyManager.removeActiveAdmin(adminComponent);
                Log.d(TAG, "Admin eliminado correctamente");
            }
        } catch (SecurityException e) {
            Log.e(TAG, "Error al eliminar device owner/admin: " + e.getMessage());
        }
    }

    @ReactMethod
    public void disallowFactoryReset() {
        Log.d(TAG, "Aplicando restricción DISALLOW_FACTORY_RESET");
        if (devicePolicyManager.isDeviceOwnerApp(getReactApplicationContext().getPackageName())) {
            devicePolicyManager.addUserRestriction(adminComponent, UserManager.DISALLOW_FACTORY_RESET);
            Log.d(TAG, "Restricción DISALLOW_FACTORY_RESET aplicada");
        } else {
            Log.e(TAG, "La aplicación no es Device Owner");
        }
    }

    @ReactMethod
    public boolean isLocked() {
        Log.d(TAG, "Aplicando restricción DISALLOW_FACTORY_RESET");
        
        if (devicePolicyManager.isDeviceOwnerApp(getReactApplicationContext().getPackageName())) {
            Bundle bundle = devicePolicyManager.getApplicationRestrictions(adminComponent);
            return bundle.getBoolean("lock_devices", false); // Se agrega valor por defecto
        } else {
            Log.e(TAG, "La aplicación no es Device Owner");
            return false; // Retornar un valor en caso de que no sea Device Owner
        }
    }

    @ReactMethod
    public void scheduleDeviceLock(int installmentId, long dueDateTimestamp) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            AlarmManager alarmManager = (AlarmManager) getReactApplicationContext().getSystemService(Context.ALARM_SERVICE);
            if (alarmManager != null && !alarmManager.canScheduleExactAlarms()) {
                Intent intent = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getReactApplicationContext().startActivity(intent);
                return;
            }
        }

        AlarmManager alarmManager = (AlarmManager) getReactApplicationContext().getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) return;

        Intent intent = new Intent(getReactApplicationContext(), LockDeviceReceiver.class);
        intent.setAction("com.plfinance.LOCK_DEVICE");

        // Usar installmentId como request code para cancelación individual
        PendingIntent pendingIntent = PendingIntent.getBroadcast(
            getReactApplicationContext(),
            installmentId,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        // Parsear dueDate a milisegundos
        Calendar calendar = Calendar.getInstance();
        calendar.setTimeZone(TimeZone.getTimeZone("UTC"));
        try {
            long dueTimeMillis = Long.parseLong(dueDate);
            calendar.setTimeInMillis(dueTimeMillis);
        } catch (NumberFormatException e) {
            e.printStackTrace();
            return; // Manejar formato inválido
        }

        // Programar la alarma
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            alarmManager.setExactAndAllowWhileIdle(
                AlarmManager.RTC_WAKEUP,
                calendar.getTimeInMillis(),
                pendingIntent
            );
        } else {
            alarmManager.setExact(
                AlarmManager.RTC_WAKEUP,
                calendar.getTimeInMillis(),
                pendingIntent
            );
        }
        
        Log.e(TAG, "Se programó el bloqueo en la fecha de corte");
    }

    @ReactMethod
    public void cancelDeviceLock(int installmentId) {
        AlarmManager alarmManager = (AlarmManager) getReactApplicationContext().getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) return;

        Intent intent = new Intent(getReactApplicationContext(), LockDeviceReceiver.class);
        intent.setAction("com.plfinance.LOCK_DEVICE");

        // Configurar flags según versión de Android
        int flags = PendingIntent.FLAG_NO_CREATE;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        // Recuperar PendingIntent existente
        PendingIntent pendingIntent = PendingIntent.getBroadcast(
            getReactApplicationContext(),
            installmentId,
            intent,
            flags
        );

        if (pendingIntent != null) {
            alarmManager.cancel(pendingIntent);
            pendingIntent.cancel(); // Limpiar el PendingIntent
        }
    }

    private byte[] generateRandomPasswordToken() {
        try {
            return SecureRandom.getInstance("SHA1PRNG").generateSeed(32);
        } catch (NoSuchAlgorithmException e) {
            e.printStackTrace();
            return null;
        }
    }
}
