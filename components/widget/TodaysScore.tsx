import { Target } from "lucide-react";
import { MetricCard } from "@/components/ui/MetricCard";

type Props = {
  score: number;
};

export default function TodaysScore({
  score,
}: Props) {
  return (
    <MetricCard
      title="Today's Score"
      value={score}
      icon={<Target size={30} />}
    />
  );
}