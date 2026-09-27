import { Blob as ExpoBlob } from "expo-blob";
import { registerRootComponent } from "expo";
import App from "./App";

globalThis.Blob = ExpoBlob;

registerRootComponent(App);
