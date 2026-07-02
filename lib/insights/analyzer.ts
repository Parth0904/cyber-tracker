import { Insight } from "./index";

export type BucketAnalysis = {
  bestBucket: string;
  impact: number;
  confidence: Insight["confidence"];
};

export function getConfidence(
  days: number
): Insight["confidence"] {
  if (days >= 14) return "High";
  if (days >= 5) return "Medium";
  return "Low";
}

export function getStrength(
  impact: number
): Insight["strength"] {
  if (impact >= 70) return "Very Strong";
  if (impact >= 40) return "Strong";
  if (impact >= 20) return "Moderate";
  return "Weak";
}

export function analyzeBuckets(
  values: {
    bucket: string;
    score: number;
  }[]
): BucketAnalysis {

  const grouped: Record<
    string,
    {
      total: number;
      days: number;
    }
  > = {};

  values.forEach((item) => {

    if (!grouped[item.bucket]) {
      grouped[item.bucket] = {
        total: 0,
        days: 0,
      };
    }

    grouped[item.bucket].total += item.score;
    grouped[item.bucket].days++;
  });

  let bestBucket = "";
  let bestAverage = -1;

  const averages: number[] = [];

  Object.entries(grouped).forEach(
    ([bucket, value]) => {

      const average =
        value.total / value.days;

      averages.push(average);

      if (average > bestAverage) {
        bestAverage = average;
        bestBucket = bucket;
      }
    }
  );

  const overall =
    averages.reduce((a, b) => a + b, 0) /
    Math.max(averages.length, 1);

  const impact =
    overall === 0
      ? 0
      : ((bestAverage - overall) /
          overall) *
        100;
  
 const confidence = getConfidence(values.length);

 if (!bestBucket) {
    bestBucket = "your usual routine";
}

return {
    bestBucket,
    impact,
    confidence,
};
}