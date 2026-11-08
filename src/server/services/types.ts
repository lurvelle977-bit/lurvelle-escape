// Who performed an action, recorded on the booking history
export type Actor = { type: "CUSTOMER" | "SYSTEM" } | { type: "ADMIN"; id: string };
