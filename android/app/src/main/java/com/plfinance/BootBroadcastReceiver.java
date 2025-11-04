package com.plfinance;

import android.app.admin.DevicePolicyManager;
import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;

public class BootBroadcastReceiver extends BroadcastReceiver {
    private static final String TAG = "BootBroadcastReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {
            Log.d(TAG, "Dispositivo reiniciado, activando LockTask");
            
            DevicePolicyManager dpm = (DevicePolicyManager) context.getSystemService(Context.DEVICE_POLICY_SERVICE);
            String packageName = context.getPackageName();
            
            if (dpm.isDeviceOwnerApp(packageName)) {
                Intent launchIntent = context.getPackageManager()
                    .getLaunchIntentForPackage(packageName);

                ComponentName adminComponent = new ComponentName(context, MyDeviceAdminReceiver.class);
                Bundle bundle = dpm.getApplicationRestrictions(adminComponent, context.getPackageName());
                Log.e(TAG, "Locked" + bundle.getBoolean("isLocked", false));
                boolean isLocked = bundle != null && bundle.getBoolean("isLocked", false);
                
                if (launchIntent != null && isLocked) {
                    launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    launchIntent.putExtra("START_LOCKMODE", true);
                    context.startActivity(launchIntent);
                    Log.d("BootBroadcastReceiver", "Aplicación iniciada en modo LockTask");
                }
            } else {
                Log.e("BootBroadcastReceiver", "La app no es propietaria del dispositivo");
            }
        }
    }
}
