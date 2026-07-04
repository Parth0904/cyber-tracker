import { Brain } from "lucide-react";
import { Panel } from "@/components/ui/Panel";

type Props = {
  recommendation: string;
};

export default function FocusRecommendation({
  recommendation,
}: Props) {
  return (
    <Panel>

      <div className="flex gap-4">

        <Brain
          size={26}
          className="text-cyan-400 mt-1"
        />

        <div>

          <h2 className="text-xl font-bold">

            Today's Focus

          </h2>

          <p className="mt-4 leading-7 text-slate-300">

            {recommendation}

          </p>

        </div>

      </div>

    </Panel>
  );
}