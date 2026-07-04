import TargetCard from "./TargetCard";

type Props = {
  targets: any[];
};

export default function TargetGrid({
  targets,
}: Props) {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

      {targets.map((target) => (

        <TargetCard
          key={target.id}
          target={target}
        />

      ))}

    </div>
  );
}