import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.skilltego.app",
  appName: "Skilltego",
  webDir: "www",
  server: {
    url: "https://web-lac-phi-87.vercel.app",
    androidScheme: "https",
    cleartext: false,
    allowNavigation: ["*.supabase.co"],
  },
};

export default config;
