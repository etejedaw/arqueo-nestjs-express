export type Resource = "profile" | "users";
export type Action = "create" | "read" | "update" | "delete" | "manage";
export type Permission = `${Resource}:${Action}`;
