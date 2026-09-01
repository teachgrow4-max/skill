import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "teachgrow.Skilltego.com",
  appName: "Skilltego",
  webDir: "www",
  server: {
    url: "https://www.skilltego.com",
    androidScheme: "https",
    cleartext: false,
    allowNavigation: ["*.supabase.co"],
  },
};

export default config;
