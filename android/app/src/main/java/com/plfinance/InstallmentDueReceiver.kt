package com.plfinance

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.facebook.react.HeadlessJsTaskService

class InstallmentDueReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        Log.d("InstallmentDueReceiver", "Alarma de vencimiento de cuota recibida")
        val serviceIntent = Intent(context, InstallmentDueService::class.java)
        context.startService(serviceIntent)
        HeadlessJsTaskService.acquireWakeLockNow(context) // mantiene el dispositivo activo durante la tarea JS
    }
}