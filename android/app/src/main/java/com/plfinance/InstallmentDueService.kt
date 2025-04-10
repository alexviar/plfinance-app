package com.plfinance

import android.content.Intent
import com.facebook.react.bridge.Arguments
import com.facebook.react.HeadlessJsTaskService
import com.facebook.react.jstasks.HeadlessJsTaskConfig

class InstallmentDueService : HeadlessJsTaskService() {
    override fun getTaskConfig(intent: Intent?): HeadlessJsTaskConfig? {
        return HeadlessJsTaskConfig(
            "handleInstallmentDue",
            Arguments.createMap(),
            10000,
            true
        )
    }
}
