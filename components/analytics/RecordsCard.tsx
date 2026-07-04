import { PersonalRecord } from "@/lib/types/analytics";
import { Card } from "@/components/ui/Card";
import StatGrid from "@/components/ui/StatGrid";

type Props = {
  records: PersonalRecord[];
};

export default function RecordsCard({
  records,
}: Props) {
  return (
    <Card title="Personal Records">

      <div className="grid md:grid-cols-2 gap-6">

        // RecordsCard.tsx
{records.map((record) => (
  <StatGrid key={record.title}>
    <div className="p-4 border border-border-subtle rounded-lg">
      <span className="text-xs text-zinc-500 uppercase">{record.title}</span>
      <div className="text-xl font-bold text-white mt-1">{record.value}</div>
    </div>
  </StatGrid>
))}
      </div>

    </Card>
  );
}