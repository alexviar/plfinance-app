package com.plfinance

import android.app.admin.DevicePolicyManager
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.util.Log

class LockDeviceReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        Log.d("LockDeviceReceiver", "onReceive called")

        val devicePolicyManager = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        val adminComponent = ComponentName(context, MyDeviceAdminReceiver::class.java)

        // Verificar si la app es administradora
        if (devicePolicyManager.isDeviceOwnerApp(context.packageName)) {
            val packages = arrayOf(context.packageName)
            devicePolicyManager.setLockTaskPackages(adminComponent, packages)
            Log.d("LockDeviceReceiver", "La aplicación tiene privilegios de administrador")

            // Crear restricciones
            val restrictions = Bundle().apply {
                putBoolean("isLocked", true)
            }
            Log.d("LockDeviceReceiver", "Restricciones creadas: $restrictions")

            // Aplicar restricciones
            devicePolicyManager.setApplicationRestrictions(
                adminComponent,
                context.packageName,
                restrictions
            )
            Log.d("LockDeviceReceiver", "Restricciones aplicadas")

            // Iniciar MainActivity
            val launchIntent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            Log.d("LockDeviceReceiver", "Iniciando MainActivity con lock_task_mode")
            context.startActivity(launchIntent)
        } else {
            Log.e("LockDeviceReceiver", "La aplicación no tiene privilegios de administrador")
        }
    }
}