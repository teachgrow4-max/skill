import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "teachgrow.Skilltego.com",
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
