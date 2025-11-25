export interface AccessContext {
  role: "anonymous" | "user" | "admin";
  userId?: string;
  scope: "owner" | "global";
}
