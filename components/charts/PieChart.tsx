"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const COLORS = [
  "#06b6d4",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
];

type Item = {
  name: string;
  value: number;
};

type Props = {
  data: Item[];
};

export default function ActivityPieChart({
  data,
}: Props) {
  return (
    <ResponsiveContainer
      width="100%"
      height={300}
    >
      <PieChart>

        <Pie
          data={data}
          dataKey="value"
          outerRadius={100}
        >

          {data.map((_, i) => (
            <Cell
              key={i}
              fill={
                COLORS[
                  i % COLORS.length
                ]
              }
            />
          ))}

        </Pie>

        <Tooltip />

      </PieChart>
    </ResponsiveContainer>
  );
}