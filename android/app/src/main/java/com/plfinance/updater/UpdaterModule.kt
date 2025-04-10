package com.plfinance.updater

import android.app.DownloadManager
import android.content.Context
import android.net.Uri
import android.os.Environment
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class UpdaterModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "Updater"
    }

    @ReactMethod
    fun downloadAndInstallApk(apkUrl: String) {
        val request = DownloadManager.Request(Uri.parse(apkUrl))
        request.setTitle("Actualización de la app")
        request.setDescription("Descargando actualización...")
        request.setDestinationInExternalFilesDir(reactContext, Environment.DIRECTORY_DOWNLOADS, "update.apk")

        val manager = reactContext.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
        val downloadId = manager.enqueue(request)

        val prefs = reactContext.getSharedPreferences("updater", Context.MODE_PRIVATE)
        prefs.edit().putLong("downloadId", downloadId).apply()
    }
}
