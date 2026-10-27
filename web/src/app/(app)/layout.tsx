import { AppHeader, AppFooter } from "@/components/shell";
import { PwaInstaller } from "@/components/pwa-installer";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <><AppHeader /><main id="main-content">{children}</main><AppFooter /><PwaInstaller /></>;
}
