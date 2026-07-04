import FilterBar from "@/components/ui/FilterBar";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function TargetFilters({
  value,
  onChange,
}: Props) {

  return (
    <FilterBar
      value={value}
      onChange={onChange}
      options={[
        "All",
        "Recon",
        "Testing",
        "Reporting",
        "Paused",
        "Completed",
      ]}
    />
  );

}