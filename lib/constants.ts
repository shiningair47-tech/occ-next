export const LEAD_ACTIONS = {
  UPLOAD_BATCH: "upload_batch",
  UPDATE_TOUCHPOINTS: "update_touchpoints",
  SET_APPOINTMENT: "set_appointment",
  UPDATE_CLOSER_STATUS: "update_closer_status",
  ACCEPT_HANDOFF: "accept_handoff",
  MARK_CALLED: "mark_called",
  UPDATE_NOTES: "update_notes",
  QUALIFY_LEAD: "qualify_lead",
  GET_DATA_REQUESTS: "get_data_requests",
  CREATE_DATA_REQUEST: "create_data_request",
  FULFILL_DATA_REQUEST: "fulfill_data_request",
  GET_REPLACEMENTS: "get_replacements",
  FULFILL_REPLACEMENT: "fulfill_replacement",
  GET_POOL: "get_pool",
  ADD_TO_POOL: "add_to_pool",
} as const;

export const AUTH_ACTIONS = {
  SET_ROLE: "set_role",
  PREVIEW_MEMBER: "preview_member",
  EXIT: "exit",
} as const;

export const USER_ACTIONS = {
  REGISTER: "register",
  UPDATE: "update",
  RESET_PASSWORD: "reset_password",
  DEACTIVATE: "deactivate",
  REACTIVATE: "reactivate",
  DELETE: "delete",
  ASSIGN_MEMBER: "assign_member",
  UNASSIGN_MEMBER: "unassign_member",
} as const;

export const TEAM_ACTIONS = {
  CREATE: "create",
  DELETE: "delete",
} as const;
