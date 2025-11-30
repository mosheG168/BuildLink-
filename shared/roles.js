export const ROLES = Object.freeze({
  SUBCONTRACTOR: "subcontractor",
  CONTRACTOR: "contractor",
  ADMIN: "admin",
});

export const ROLE_LIST = Object.freeze(Object.values(ROLES));

export const isSubcontractor = (r) => r === ROLES.SUBCONTRACTOR;
export const isContractor = (r) => r === ROLES.CONTRACTOR;
export const isAdmin = (r) => r === ROLES.ADMIN;

export default { ROLES, ROLE_LIST, isContractor, isSubcontractor };
