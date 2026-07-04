import { Badge } from "@/components/ui/Badge";

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

  const variant =
    status === "Completed"
      ? "success"
      : status === "Reporting"
      ? "cyan"
      : status === "Testing"
      ? "warning"
      : status === "Paused"
      ? "neutral"
      : "danger";

  return (
    <Badge variant={variant}>
      {status}
    </Badge>
  );
}