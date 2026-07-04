import {
  BookOpen,
  Radar,
  Target,
  Bug,
  FileText,
} from "lucide-react";

import SectionCard from "@/components/dashboard/SectionCard";
import ActivityButton from "./ActivityButton";

type ActivityType =
  | "learning"
  | "recon"
  | "target"
  | "finding"
  | "bug_report";

type Props = {
  onAdd: (type: ActivityType) => void;

  todayCounts: Record<
    ActivityType,
    number
  >;
};

const buttons = [
  {
    type: "learning",
    label: "Learning",
    icon: <BookOpen size={34} />,
  },
  {
    type: "recon",
    label: "Recon",
    icon: <Radar size={34} />,
  },
  {
    type: "target",
    label: "Target",
    icon: <Target size={34} />,
  },
  {
    type: "finding",
    label: "Finding",
    icon: <Bug size={34} />,
  },
  {
    type: "bug_report",
    label: "Bug Report",
    icon: <FileText size={34} />,
  },
] as const;

export default function ActivityPad({
  onAdd,
  todayCounts,
}: Props) {
  return (
    <SectionCard
      title="Quick Actions"
      description="Record completed work instantly."
    >
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">

        {buttons.map((button) => (

          <ActivityButton
            key={button.type}
            icon={button.icon}
            label={button.label}
            count={
              todayCounts[
                button.type
              ]
            }
            onClick={() =>
              onAdd(button.type)
            }
          />

        ))}

      </div>

    </SectionCard>
  );
}