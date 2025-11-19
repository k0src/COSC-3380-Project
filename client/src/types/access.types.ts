export interface AccessContext {
  role: "anonymous" | "user" | "admin";
  userId?: string;
  scope: "single" | "globalList" | "ownerList";
}
