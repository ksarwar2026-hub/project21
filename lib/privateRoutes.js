export const ADMIN_DASHBOARD_PATH = process.env.NEXT_PUBLIC_ADMIN_PATH || "/pnnqyytx6b";
export const STORE_DASHBOARD_PATH = process.env.NEXT_PUBLIC_STORE_PATH || "/stnwqx7b4";

export function adminPath(path = "") {
  return `${ADMIN_DASHBOARD_PATH}${path}`;
}

export function storePath(path = "") {
  return `${STORE_DASHBOARD_PATH}${path}`;
}
