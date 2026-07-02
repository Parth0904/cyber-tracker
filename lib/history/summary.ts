type HistoryDay = {
  score: number;
  completion: number;
};

type HistorySummary = {
  totalDays: number;
  averageScore: number;
  highestScore: number;
  completionRate: number;
};

export function generateHistorySummary(
  history: HistoryDay[]
): HistorySummary {

  if (history.length === 0) {
    return {
      totalDays: 0,
      averageScore: 0,
      highestScore: 0,
      completionRate: 0,
    };
  }

  return {

    totalDays: history.length,

    averageScore:
      Number(
        (
          history.reduce(
            (sum, day) =>
              sum + day.score,
            0
          ) / history.length
        ).toFixed(1)
      ),

    highestScore:
      Math.max(
        ...history.map(
          (d) => d.score
        )
      ),

    completionRate:
      Math.round(
        history.reduce(
          (sum, day) =>
            sum + day.completion,
          0
        ) / history.length
      ),

  };
}