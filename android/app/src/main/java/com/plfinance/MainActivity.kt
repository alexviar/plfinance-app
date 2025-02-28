package com.plfinance


import android.Manifest
import android.app.AlarmManager
import android.content.Intent
import android.os.Build
import android.provider.Settings
import android.app.admin.DevicePolicyManager
import android.content.ComponentName;
import android.content.Context
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import android.os.Bundle;
import android.util.Log;
import android.widget.Toast;
import com.zoontek.rnbootsplash.RNBootSplash;

class MainActivity : ReactActivity() {
    private lateinit var devicePolicyManager: DevicePolicyManager

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "PLFinance"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
   
  override fun onCreate(savedInstanceState: Bundle?) {
    RNBootSplash.init(this, R.style.BootTheme) // ⬅️ initialize the splash screen
    super.onCreate(savedInstanceState) // super.onCreate(null) with react-native-screens
  }

  override fun onResume() {
    super.onResume()
    devicePolicyManager = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
    val adminComponent = ComponentName(this, MyDeviceAdminReceiver::class.java)

    if(devicePolicyManager.isDeviceOwnerApp(packageName)){

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) { // Android 12+
        devicePolicyManager.setPermissionGrantState(
            adminComponent,
            packageName,
            Manifest.permission.SCHEDULE_EXACT_ALARM,
            DevicePolicyManager.PERMISSION_GRANT_STATE_GRANTED
        )
    
        devicePolicyManager.setPermissionPolicy(adminComponent, DevicePolicyManager.PERMISSION_POLICY_AUTO_GRANT)
      }

      val bundle = devicePolicyManager.getApplicationRestrictions(adminComponent, packageName)
      val shouldLock = bundle.getBoolean("isLocked", false)
      
      Toast.makeText(this, if (shouldLock) "Lock task activado" else "Lock task no activado", Toast.LENGTH_SHORT).show()
      Log.e("MainActivity", if (shouldLock) "Lock task activado" else "Lock task no activado");
      if (shouldLock && devicePolicyManager.isDeviceOwnerApp(packageName)) {
          startLockTask()
      }
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      val alarmManager = getSystemService(Context.ALARM_SERVICE) as? AlarmManager
      if (alarmManager != null && !alarmManager.canScheduleExactAlarms()) {
          val intent = Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM).apply {
              addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
          }
          startActivity(intent)
      }
    }
  }
}
