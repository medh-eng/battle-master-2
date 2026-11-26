import type { Run } from "../campaign/run.ts";
const KEY = "bm2.ironwake.v1";
function valid(value: string | null): Run | null {
  if (!value) return null;
  try {
    const r = JSON.parse(value);
    if (
      r.version !== 1 ||
      !["battle", "camp", "result"].includes(r.scene) ||
      !Array.isArray(r.roster) ||
      !Array.isArray(r.history) ||
      !Array.isArray(r.battle?.pending) ||
      r.battle?.sides?.length !== 2
    )
      return null;
    return r;
  } catch {
    return null;
  }
}
export function load(): Run | null {
  try {
    return (
      valid(localStorage.getItem(KEY)) ??
      valid(localStorage.getItem(KEY + ".backup"))
    );
  } catch {
    return null;
  }
}
export function save(r: Run): boolean {
  try {
    const prev = localStorage.getItem(KEY);
    if (prev && valid(prev)) localStorage.setItem(KEY + ".backup", prev);
    localStorage.setItem(KEY, JSON.stringify(r));
    return true;
  } catch {
    return false;
  }
}
