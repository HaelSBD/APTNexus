const fs = require("fs");
const path = require("path");
const { withAndroidManifest, withDangerousMod } = require("@expo/config-plugins");

const LAUNCHER = "android.intent.category.LAUNCHER";
const MAIN = "android.intent.action.MAIN";

function isLauncherFilter(filter) {
  const actions = filter.action || [];
  const categories = filter.category || [];
  return (
    actions.some((action) => action.$["android:name"] === MAIN) &&
    categories.some((category) => category.$["android:name"] === LAUNCHER)
  );
}

function launcherFilter() {
  return [
    {
      action: [{ $: { "android:name": MAIN } }],
      category: [{ $: { "android:name": LAUNCHER } }],
    },
  ];
}

function upsertAlias(aliases, name, icon, roundIcon, enabled) {
  const next = {
    $: {
      "android:name": name,
      "android:enabled": enabled,
      "android:exported": "true",
      "android:icon": icon,
      "android:roundIcon": roundIcon,
      "android:targetActivity": ".MainActivity",
    },
    "intent-filter": launcherFilter(),
  };
  const index = aliases.findIndex((alias) => alias.$["android:name"] === name);
  if (index >= 0) {
    aliases[index] = next;
  } else {
    aliases.push(next);
  }
}

function withIconSwitcher(config) {
  return withDangerousMod(config, [
    "android",
    (config) => {
      const from = path.join(__dirname, "ExpoAlternateAppIconsModule.kt");
      const to = path.join(
        config.modRequest.projectRoot,
        "node_modules",
        "expo-alternate-app-icons",
        "android",
        "src",
        "main",
        "java",
        "expo",
        "modules",
        "alternateappicons",
        "ExpoAlternateAppIconsModule.kt",
      );
      fs.mkdirSync(path.dirname(to), { recursive: true });
      fs.copyFileSync(from, to);
      return config;
    },
  ]);
}

function withImmediateAppIcons(config) {
  config = withIconSwitcher(config);
  return withAndroidManifest(config, (config) => {
    const application = config.modResults.manifest.application?.[0];
    if (!application) return config;
    const main = (application.activity || []).find((activity) => activity.$["android:name"] === ".MainActivity");
    if (main?.["intent-filter"]) {
      main["intent-filter"] = main["intent-filter"].filter((filter) => !isLauncherFilter(filter));
      if (!main["intent-filter"].length) delete main["intent-filter"];
    }
    // Keep exactly one launcher alias per icon — drop duplicates from other plugins.
    const wanted = new Set([".MainActivityMidnight", ".MainActivityLight", ".MainActivitySunset"]);
    const aliases = (application["activity-alias"] || []).filter((alias) => wanted.has(alias.$?.["android:name"]));
    upsertAlias(aliases, ".MainActivityMidnight", "@mipmap/ic_launcher", "@mipmap/ic_launcher_round", "true");
    upsertAlias(aliases, ".MainActivityLight", "@mipmap/ic_launcher_light", "@mipmap/ic_launcher_light", "false");
    upsertAlias(aliases, ".MainActivitySunset", "@mipmap/ic_launcher_sunset", "@mipmap/ic_launcher_sunset", "false");
    application["activity-alias"] = aliases;
    return config;
  });
}

module.exports = withImmediateAppIcons;
