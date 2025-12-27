
import AttentionMap from "@/components/AttentionMap";
import { getAttentionSnapshot } from "@/lib/attention";
import { resolveDefaults } from "@/lib/defaults";

const formatDisplayTime = (timestamp: number) =>
  `${new Date(timestamp).toISOString().slice(11, 16)} UTC`;

export default async function Home() {
  const snapshot = getAttentionSnapshot();
  const defaults = resolveDefaults(snapshot.zones);
  const displayTime = formatDisplayTime(snapshot.timestamp);

  return (
    <main className="relative min-h-screen bg-slate-950">
      <AttentionMap
        zones={snapshot.zones}
        defaults={defaults}
        displayTime={displayTime}
      />
    </main>
  );
}
