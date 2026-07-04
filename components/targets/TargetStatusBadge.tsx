import Badge from "@/components/ui/Badge";

type Props = {
  status:
    | "Recon"
    | "Testing"
    | "Reporting"
    | "Paused"
    | "Completed";
};

export default function TargetStatusBadge({
  status,
}: Props) {

  const color =
    status === "Completed"
      ? "green"
      : status === "Reporting"
      ? "blue"
      : status === "Testing"
      ? "yellow"
      : status === "Paused"
      ? "gray"
      : "red";

  return (
    <Badge
      text={status}
      color={color}
    />
  );
}