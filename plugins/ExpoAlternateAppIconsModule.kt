package expo.modules.alternateappicons

import android.content.ComponentName
import android.content.pm.PackageManager
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

private val ICON_NAMES = listOf("Midnight", "Light", "Sunset")

class ExpoAlternateAppIconsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoAlternateAppIcons")

    Constants(
      "supportsAlternateIcons" to true
    )

    Function("getAppIconName", this@ExpoAlternateAppIconsModule::getAppIconName)
    AsyncFunction("setAlternateAppIcon").Coroutine(this@ExpoAlternateAppIconsModule::setAlternateAppIcon)
  }

  private fun getAppIconName(): String? {
    val context = appContext.reactContext ?: return null
    val packageManager = context.packageManager
    val packageName = context.packageName
    // Prefer an explicitly enabled icon; fall back to manifest default (Midnight).
    return ICON_NAMES.firstOrNull { name ->
      isEnabled(packageManager, component(packageName, name), name == "Midnight")
    }
  }

  private suspend fun setAlternateAppIcon(icon: String?): String? = withContext(Dispatchers.Main) {
    val context = appContext.reactContext ?: return@withContext icon
    val packageManager = context.packageManager
    val packageName = context.packageName
    val target = if (icon.isNullOrBlank() || icon !in ICON_NAMES) "Midnight" else icon
    // Disable every launcher alias first, then enable only the target.
    // Enabling before disabling leaves two LAUNCHER components active and many
    // Android launchers permanently spawn duplicate home-screen icons.
    setExclusiveIcon(packageManager, packageName, target)
    target
  }

  private fun setExclusiveIcon(
    packageManager: PackageManager,
    packageName: String,
    target: String,
  ) {
    val flags = PackageManager.DONT_KILL_APP
    for (name in ICON_NAMES) {
      packageManager.setComponentEnabledSetting(
        component(packageName, name),
        PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
        flags,
      )
    }
    packageManager.setComponentEnabledSetting(
      component(packageName, target),
      PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
      flags,
    )
  }

  private fun component(packageName: String, iconName: String): ComponentName =
    ComponentName(packageName, "$packageName.MainActivity$iconName")

  private fun isEnabled(
    packageManager: PackageManager,
    component: ComponentName,
    manifestDefault: Boolean,
  ): Boolean =
    when (packageManager.getComponentEnabledSetting(component)) {
      PackageManager.COMPONENT_ENABLED_STATE_ENABLED -> true
      PackageManager.COMPONENT_ENABLED_STATE_DISABLED -> false
      else -> manifestDefault
    }
}
