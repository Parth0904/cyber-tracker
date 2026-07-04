import {Panel} from "@/components/ui/Panel";
type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export default function Section({
  title,
  subtitle,
  children,
}: Props) {
  return (
    <Panel>

      <div className="mb-6">

        <h2 className="text-2xl font-bold">

          {title}

        </h2>

        {subtitle && (

          <p className="mt-2 text-slate-400">

            {subtitle}

          </p>

        )}

      </div>

      {children}

    </Panel>
  );
}