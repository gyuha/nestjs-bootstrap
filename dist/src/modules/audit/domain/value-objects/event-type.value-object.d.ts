export declare const AuditEventType: {
  readonly LOGIN: "LOGIN";
  readonly LOGOUT: "LOGOUT";
  readonly LOGIN_FAILED: "LOGIN_FAILED";
  readonly PASSWORD_CHANGE: "PASSWORD_CHANGE";
  readonly EMAIL_VERIFY: "EMAIL_VERIFY";
  readonly USER_CREATE: "USER_CREATE";
  readonly USER_UPDATE: "USER_UPDATE";
  readonly USER_DELETE: "USER_DELETE";
  readonly ROLE_CHANGE: "ROLE_CHANGE";
  readonly ACCOUNT_LOCK: "ACCOUNT_LOCK";
  readonly ACCOUNT_UNLOCK: "ACCOUNT_UNLOCK";
  readonly API_CALL: "API_CALL";
  readonly MAGIC_LINK_REQUEST: "MAGIC_LINK_REQUEST";
  readonly PASSWORD_RESET_REQUEST: "PASSWORD_RESET_REQUEST";
};
export type AuditEventType = (typeof AuditEventType)[keyof typeof AuditEventType];
