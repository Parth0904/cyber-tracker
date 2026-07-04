import { Flame } from "lucide-react";

import MetricCard from "@/components/ui/MetricCard";

type Props = {
  current: number;
};

export default function CurrentStreak({
  current,
}: Props) {
  return (
    <MetricCard
      title="Current Streak"
      value={`${current}`}
      icon={
        <Flame
          size={32}
          className="text-orange-400"
        />
      }
    />
  );
}