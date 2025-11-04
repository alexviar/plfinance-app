package com.plfinance

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import com.facebook.react.HeadlessJsTaskService
import com.facebook.react.bridge.Arguments
import com.facebook.react.jstasks.HeadlessJsTaskConfig
import androidx.core.app.NotificationCompat

class InstallmentDueService : HeadlessJsTaskService() {
    companion object {
        private const val CHANNEL_ID = "installment_due_channel"
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Financed Device")
            .setContentText("Procesando cuota vencida")
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .build()
        if (Build.VERSION.SDK_INT >= 34) {
            startForeground(
                1,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_SYSTEM_EXEMPTED
            )
        } else {
            startForeground(1, notification)
        }
    }

    override fun getTaskConfig(intent: Intent?): HeadlessJsTaskConfig? {
        return HeadlessJsTaskConfig(
            "handleInstallmentDue",
            Arguments.createMap(),
            10000,
            true
        )
    }

    override fun onHeadlessJsTaskFinish(taskId: Int) {
        stopForeground(true)
        stopSelf()
        super.onHeadlessJsTaskFinish(taskId)
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Cuota vencida",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }
}
