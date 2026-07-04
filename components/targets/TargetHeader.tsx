import Page from "@/components/ui/Page";

type Props = {
  children?: React.ReactNode;
};

export default function TargetHeader({
  children,
}: Props) {
  return (
    <Page
      title="Targets"
      subtitle="Manage active bug bounty programs and monitor progress."
    >
      {children}
    </Page>
  );
}