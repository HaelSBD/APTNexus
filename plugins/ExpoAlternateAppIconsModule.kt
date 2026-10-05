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
    return ICON_NAMES.firstOrNull { name -> isEnabled(packageManager, component(packageName, name), name == "Midnight") }
  }

  private suspend fun setAlternateAppIcon(icon: String?): String? = withContext(Dispatchers.Main) {
    val context = appContext.reactContext ?: return@withContext icon
    val packageManager = context.packageManager
    val packageName = context.packageName
    val target = if (icon.isNullOrBlank() || icon !in ICON_NAMES) "Midnight" else icon

    packageManager.setComponentEnabledSetting(
      component(packageName, target),
      PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
      0,
    )
    ICON_NAMES.filter { it != target }.forEach { name ->
      packageManager.setComponentEnabledSetting(
        component(packageName, name),
        PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
        0,
      )
    }
    target
  }

  private fun component(packageName: String, iconName: String): ComponentName =
    ComponentName(packageName, "$packageName.MainActivity$iconName")

  private fun isEnabled(packageManager: PackageManager, component: ComponentName, manifestDefault: Boolean): Boolean =
    when (packageManager.getComponentEnabledSetting(component)) {
      PackageManager.COMPONENT_ENABLED_STATE_ENABLED -> true
      PackageManager.COMPONENT_ENABLED_STATE_DISABLED -> false
      else -> manifestDefault
    }
}
