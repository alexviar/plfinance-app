package com.plfinance.webviewinfo

import android.os.Build
import android.webkit.WebView
import android.content.pm.PackageInfo
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule

class WebViewInfoModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), LifecycleEventListener {

    private var packageName: String = ""
    private var versionName: String = ""
    private var versionCode: Int = 0

    companion object {
        const val NAME = "WebViewInfo"
        const val EVENT_NAME = "onUpdated"
    }

    init {
        reactContext.addLifecycleEventListener(this)
    }

    override fun getName(): String = NAME

    override fun onHostResume() {
        updatePackageInfo()

        val eventData = Arguments.createMap().apply {
            putString("packageName", packageName)
            putString("versionName", versionName)
            putInt("versionCode", versionCode)
        }
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(EVENT_NAME, eventData)
    }

    override fun onHostPause() {}
    override fun onHostDestroy() {}

    private fun updatePackageInfo() {
        try {
            val pkgInfo: PackageInfo? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                WebView.getCurrentWebViewPackage()
            } else {
                reactContext.packageManager.getPackageInfo("com.google.android.webview", 0)
            }

            pkgInfo?.let {
                packageName = it.packageName ?: ""
                versionName = it.versionName ?: ""
                versionCode = if (Build.VERSION.SDK_INT >= 28) {
                    it.longVersionCode.toInt()
                } else {
                    it.versionCode
                }
            }
        } catch (e: Exception) {
            packageName = ""
            versionName = ""
            versionCode = 0
            e.printStackTrace()
        }
    }

    @ReactMethod
    fun getPackageName(): String {
        return packageName
    }

    @ReactMethod
    fun getVersionName(): String {
        return versionName
    }

    @ReactMethod
    fun getVersionCode(): Int {
        return versionCode
    }

    @ReactMethod
    fun addListener(eventName: String) {
        // Keep: Required for RN built in Event Emitter Calls.
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Keep: Required for RN built in Event Emitter Calls.
    }
}
