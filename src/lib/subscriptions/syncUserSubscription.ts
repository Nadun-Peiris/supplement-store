import User from "@/models/User";

export type SubscriptionSyncStatus = "active" | "cancelled" | "completed";

type SyncUserSubscriptionInput = {
  userId: string;
  subscriptionId: string | null;
  status: SubscriptionSyncStatus;
  nextBillingDate?: Date | null;
  lastPaymentDate?: Date | null;
};

export const buildUserSubscriptionUpdate = ({
  subscriptionId,
  status,
  nextBillingDate,
  lastPaymentDate,
}: Omit<SyncUserSubscriptionInput, "userId">) => {
  const update: Record<string, unknown> = {
    "subscription.subscriptionId": subscriptionId,
    "subscription.active": status === "active",
    "subscription.status": status,
    "subscription.nextBillingDate":
      status === "active" ? nextBillingDate ?? null : null,
  };

  if (lastPaymentDate !== undefined) {
    update["subscription.lastPaymentDate"] = lastPaymentDate;
  }

  return { $set: update };
};

export async function syncUserSubscriptionState(input: SyncUserSubscriptionInput) {
  await User.updateOne(
    { _id: input.userId },
    buildUserSubscriptionUpdate(input)
  );
}
