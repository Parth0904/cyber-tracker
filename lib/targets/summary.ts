import { Target } from "./types";

export function getTargetAge(
  target: Target
) {

  const started =
    new Date(target.started_at);

  const now =
    new Date();

  return Math.floor(

    (
      now.getTime() -
      started.getTime()

    ) /

    (1000 * 60 * 60 * 24)

  );

}