package com.mozomint.zignore.icons

import android.content.ComponentName
import android.content.Context
import android.content.pm.PackageManager
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class IconSwitcherModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String {
    return "IconSwitcher"
  }

  private fun setAliasEnabled(context: Context, alias: String, enabled: Boolean) {
    val component = ComponentName(context.packageName, alias)
    val pm = context.packageManager
    val state = if (enabled) PackageManager.COMPONENT_ENABLED_STATE_ENABLED else PackageManager.COMPONENT_ENABLED_STATE_DISABLED
    pm.setComponentEnabledSetting(component, state, PackageManager.DONT_KILL_APP)
  }

  @ReactMethod
  fun setLauncherIcon(mode: String) {
    // mode: "default" | "light" | "dark"
    val ctx = reactApplicationContext
    try {
      val defaultAlias = "${ctx.packageName}.LauncherAliasDefault"
      val lightAlias = "${ctx.packageName}.LauncherAliasLight"
      val darkAlias = "${ctx.packageName}.LauncherAliasDark"

      when (mode) {
        "light" -> {
          setAliasEnabled(ctx, defaultAlias, false)
          setAliasEnabled(ctx, lightAlias, true)
          setAliasEnabled(ctx, darkAlias, false)
        }
        "dark" -> {
          setAliasEnabled(ctx, defaultAlias, false)
          setAliasEnabled(ctx, lightAlias, false)
          setAliasEnabled(ctx, darkAlias, true)
        }
        else -> {
          // default
          setAliasEnabled(ctx, defaultAlias, true)
          setAliasEnabled(ctx, lightAlias, false)
          setAliasEnabled(ctx, darkAlias, false)
        }
      }
    } catch (e: Exception) {
      // swallow: fallback behavior on unsupported launchers
      e.printStackTrace()
    }
  }
}
