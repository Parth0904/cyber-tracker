import Link from "next/link";

import Panel from "@/components/ui/Panel";

import TargetStatusBadge from "./TargetStatusBadge";

import { Globe } from "lucide-react";

type Props = {
  target: any;
};

export default function TargetCard({
  target,
}: Props) {

  return (

    <Link
      href={`/targets/${target.id}`}
    >

      <Panel>

        <div className="flex justify-between">

          <div>

            <h2 className="text-xl font-bold">

              {target.name}

            </h2>

            <p className="text-slate-400 mt-1">

              {target.platform}

            </p>

          </div>

          <Globe
            className="text-cyan-400"
          />

        </div>

        <div className="mt-6">

          <TargetStatusBadge
            status={target.status}
          />

        </div>

        <div className="grid grid-cols-2 gap-4 mt-8">

          <div>

            <p className="text-slate-500 text-xs">

              Hours

            </p>

            <p className="text-2xl font-black">

              {target.hours}

            </p>

          </div>

          <div>

            <p className="text-slate-500 text-xs">

              Findings

            </p>

            <p className="text-2xl font-black">

              {target.findings}

            </p>

          </div>

        </div>

      </Panel>

    </Link>

  );

}