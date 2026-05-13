export const OPEN_SUPPLEMENT_COACH_EVENT = "supplement-coach:open";

export type OpenSupplementCoachDetail = {
  prompt?: string;
  autoSend?: boolean;
};

export const openSupplementCoach = (
  detail: OpenSupplementCoachDetail = {}
) => {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent<OpenSupplementCoachDetail>(OPEN_SUPPLEMENT_COACH_EVENT, {
      detail,
    })
  );
};
