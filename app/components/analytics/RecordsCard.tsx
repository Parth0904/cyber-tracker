import Card from "@/app/components/common/Card";
import Stat from "@/app/components/common/Stat";
import { PersonalRecord } from "@/lib/types/analytics";

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