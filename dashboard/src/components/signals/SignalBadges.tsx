import { Badge } from "@/components/ui/badge";
import type { SignalDirection, SignalOutcome } from "@/lib/api/types";

export function DirectionBadge({ direction }: { direction: SignalDirection }) {
  return (
    <Badge variant={direction === "BUY" ? "success" : "destructive"}>{direction}</Badge>
  );
}

const OUTCOME_VARIANT: Record<SignalOutcome, "success" | "destructive" | "muted" | "warning"> = {
  WIN: "success",
  LOSS: "destructive",
  EXPIRED: "warning",
  PENDING: "muted",
};

export function OutcomeBadge({ outcome }: { outcome: SignalOutcome }) {
  return <Badge variant={OUTCOME_VARIANT[outcome]}>{outcome}</Badge>;
}
