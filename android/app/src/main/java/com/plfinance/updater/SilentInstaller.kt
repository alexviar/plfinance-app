package com.plfinance.updater

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageInstaller
import java.io.File

object SilentInstaller {
    fun install(context: Context, file: File) {
        try {
            val packageInstaller = context.packageManager.packageInstaller
            val params = PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL)
            val sessionId = packageInstaller.createSession(params)
            val session = packageInstaller.openSession(sessionId)

            val inputStream = file.inputStream()
            val out = session.openWrite("app_update", 0, -1)
            inputStream.copyTo(out)
            session.fsync(out)
            out.close()
            inputStream.close()

            val intent = Intent(context, DownloadReceiver::class.java) // dummy
            val pendingIntent = PendingIntent.getBroadcast(
                context,
                sessionId,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            session.commit(pendingIntent.intentSender)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
