import { ProfileScreen } from "@/components/profile-screen";
import { RequireAccount } from "@/components/require-account";
export default function Page() { return <RequireAccount returnTo="/profile/"><ProfileScreen /></RequireAccount>; }
