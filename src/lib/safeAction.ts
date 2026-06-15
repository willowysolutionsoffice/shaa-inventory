import { createSafeActionClient } from "next-safe-action";

export const actionClient = createSafeActionClient({
  handleServerError(e) {
    console.error("Server action error:", e);
    return e.message ?? "An unexpected error occurred";
  },
});