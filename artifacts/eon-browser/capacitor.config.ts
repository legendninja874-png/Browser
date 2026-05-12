import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.eonbrowser.app",
  appName: "EoN Browser",
  webDir: "dist/public",
  server: {
    androidScheme: "https",
  },
  android: {
    backgroundColor: "#0d0d0d",
    allowMixedContent: true,
  },
  plugins: {
    Browser: {
      presentationStyle: "fullscreen",
    },
  },
};

export default config;
