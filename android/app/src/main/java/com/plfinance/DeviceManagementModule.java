package com.plfinance;

import android.app.Activity;
import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import androidx.annotation.NonNull;
import android.util.Log;
import android.app.KeyguardManager;
import android.os.UserManager;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.lang.SuppressWarnings;
import java.lang.reflect.Method;
import java.io.BufferedReader;
import java.io.InputStreamReader;

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
        // Configurar LockTask al habilitar el propietario del dispositivo
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
            Log.e(TAG, "La app no esta en primer plano");
        }
    }

    @ReactMethod
    @SuppressWarnings("deprecation")
    public void release() {
        try {
            if (devicePolicyManager.isDeviceOwnerApp(reactContext.getPackageName())) {
                devicePolicyManager.clearDeviceOwnerApp(reactContext.getPackageName());
                Log.d("DeviceOwner", "Device owner removed successfully");
            }

            if (devicePolicyManager.isAdminActive(adminComponent)) {
                devicePolicyManager.removeActiveAdmin(adminComponent);
                Log.d("DeviceOwner", "Admin rights removed successfully");
            }
        } catch (SecurityException e) {
            Log.e("DeviceOwner", "Error removing device owner/admin: " + e.getMessage());
        }
    }

    @ReactMethod
    public void disallowFactoryReset() {
        Log.d(TAG, "Aplicando restricción DISALLOW_FACTORY_RESET");
        // Verificar si es Device Owner
        if (devicePolicyManager.isDeviceOwnerApp(getReactApplicationContext().getPackageName())) {
            // Aplicar restricciones
            devicePolicyManager.addUserRestriction(adminComponent, UserManager.DISALLOW_FACTORY_RESET);
            Log.d(TAG, "Restricción DISALLOW_FACTORY_RESET aplicada");
        } else {
            Log.e(TAG, "La aplicación no es Device Owner");
        }
    }

    @ReactMethod
    public void startLockTask() {
        Log.d(TAG, "Iniciando Lock Mode");

        // First, confirm that this package is allowlisted to run in lock task mode.
        if (devicePolicyManager.isLockTaskPermitted(getReactApplicationContext().getPackageName())) {
            android.widget.Toast.makeText(getReactApplicationContext(), "Iniciando bloqueo de tareas...",
                    android.widget.Toast.LENGTH_SHORT).show();
            getCurrentActivity().startLockTask();
        } else {
            android.widget.Toast.makeText(getReactApplicationContext(), "El bloquo de tareas no esta permitido...",
                    android.widget.Toast.LENGTH_SHORT).show();
            // Because the package isn't allowlisted, calling startLockTask() here
            // would put the activity into screen pinning mode.
        }
    }

    @ReactMethod
    public void stopLockTask() {
        Log.d(TAG, "Deteniendo Bloqueo de tareas");
        android.widget.Toast.makeText(getReactApplicationContext(), "Deteniendo el bloqueo de tareas...",
                android.widget.Toast.LENGTH_SHORT).show();
        getCurrentActivity().stopLockTask();
    }

    @ReactMethod
    public void enableLockTask() {
        String packageName = getReactApplicationContext().getPackageName();
        // Configurar LockTask al habilitar el propietario del dispositivo
        if (devicePolicyManager.isDeviceOwnerApp(packageName)) {
            String[] packages = new String[] { packageName };
            devicePolicyManager.setLockTaskPackages(adminComponent, packages);
            Log.d(TAG, "LockTask configurado correctamente");
            android.widget.Toast.makeText(getReactApplicationContext(), "LockTask configurado correctamente",
                    android.widget.Toast.LENGTH_SHORT).show();
        } else {
            Log.e(TAG, "La app no es propietaria del dispositivo");
            android.widget.Toast.makeText(getReactApplicationContext(), "La app no es prpietaria del dispositivo",
                    android.widget.Toast.LENGTH_SHORT).show();
        }
    }

    @ReactMethod
    public void setDeviceOwner() {
        try {
            String packageName = getReactApplicationContext().getPackageName();

            if (devicePolicyManager.isDeviceOwnerApp(packageName)) {
                Log.d(TAG, "Ya es propietario del dispositivo");
                return;
            }

            String command = "dpm set-device-owner " + packageName + "/.MyDeviceAdminReceiver";
            Process process = Runtime.getRuntime().exec(command);

            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            String line;
            StringBuilder output = new StringBuilder();
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
            }

            int exitCode = process.waitFor();
            if (exitCode == 0) {
                Log.d(TAG, "Device Owner configurado correctamente: " + output.toString());
                android.widget.Toast.makeText(getReactApplicationContext(),
                        "Configurado como Device Owner",
                        android.widget.Toast.LENGTH_SHORT).show();
            } else {
                Log.e(TAG, "Error al ejecutar comando: " + output.toString());
                android.widget.Toast.makeText(getReactApplicationContext(),
                        "Error al configurar Device Owner",
                        android.widget.Toast.LENGTH_SHORT).show();
            }
        } catch (Exception e) {
            Log.e(TAG, "Error: " + e.getMessage());
            android.widget.Toast.makeText(getReactApplicationContext(),
                    "Error: " + e.getMessage(),
                    android.widget.Toast.LENGTH_LONG).show();
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

    private void changePasswordWithToken(String newPassword) {
        byte[] token = "01234567891012131415161718192021222".getBytes(); // generateRandomPasswordToken();

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            // devicePolicyManager.setKeyguardDisabledFeatures(adminComponent,
            // DevicePolicyManager.KEYGUARD_DISABLE_FINGERPRINT);
            if (devicePolicyManager.isResetPasswordTokenActive(this.adminComponent)) {
                Log.d("DeviceOwner", "El token es válido y está activo.");
                boolean changed = devicePolicyManager.resetPasswordWithToken(this.adminComponent, newPassword, token,
                        0);
                if (changed) {
                    Log.d("DeviceOwner", "Contraseña cambiada con éxito.");
                } else {
                    Log.e("DeviceOwner", "Error al cambiar la contraseña.");
                }
            } else {
                Log.e("DeviceOwner", "El token no es válido o no está activo.");
                boolean success = devicePolicyManager.setResetPasswordToken(this.adminComponent, token);
                KeyguardManager keyguardManager = (KeyguardManager) reactContext
                        .getSystemService(Context.KEYGUARD_SERVICE);
                Intent confirmIntent = keyguardManager.createConfirmDeviceCredentialIntent(null,
                        "ACTIVATE_TOKEN_PROMPT");

                if (confirmIntent != null) {
                    Activity currentActivity = getCurrentActivity();
                    if (currentActivity != null) {
                        currentActivity.startActivityForResult(confirmIntent, 1);
                    }
                    // Check your onActivityResult() callback for RESULT_OK
                } else {
                    // Null means the user doesn't have a lock screen so the token is already
                    // active.
                    // Call isResetPasswordTokenActive() if you need to confirm
                }
            }
        } else {
            devicePolicyManager.resetPassword(newPassword, DevicePolicyManager.RESET_PASSWORD_REQUIRE_ENTRY);
        }
    }
}
