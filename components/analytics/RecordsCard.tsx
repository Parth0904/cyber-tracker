import { PersonalRecord } from "@/lib/types/analytics";
import { Card } from "@/components/ui/Card";
import { Stat } from "@/components/ui/Stat";

type Props = {
  records: PersonalRecord[];
};

export default function RecordsCard({
  records,
}: Props) {
  return (
    <Card title="Personal Records">

      <div className="grid md:grid-cols-2 gap-6">

        {records.map((record) => (

          <Stat
            key={record.title}
            label={record.title}
            value={record.value}
          />

        ))}

      </div>

    </Card>
  );
}