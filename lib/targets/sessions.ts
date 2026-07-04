export function averageSessionLength(
  totalMinutes: number,
  sessions: number
) {

  if (sessions === 0)
    return 0;

  return Math.round(
    totalMinutes /
      sessions
  );

}