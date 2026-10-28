// What #4471 holds once each report is read for the bug it describes, not the ticket it was merged into.
// causes.ts places a report by tenant and channel; the desk's own notes (desk-notes.json) mark the
// reports whose date moved by one day instead of flipping. Those are a third problem, not `parser`.
import { causeOf, uniqueById, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = 'parser' | 'hint' | 'one-day' | 'unplaced';

export function problemOf(r: Report, t: Tenant | undefined, oneDayMove: readonly string[]): Problem {
  if (oneDayMove.includes(r.id)) return 'one-day';
  return causeOf(r, t) ?? 'unplaced';
}

export type ProblemRow = {
  problem: Problem;
  reports: number;
  tenants: number;
  channels: Record<string, number>;
  firstSeen: string;
  lastSeen: string;
};

export function splitTicket(
  all: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): { rows: number; unique: number; problems: ProblemRow[] } {
  const inTicket = all.filter((r) => r.mergedInto === ticket);
  const unique = uniqueById(inTicket);
  const by = new Map<Problem, Report[]>();
  for (const r of unique) {
    const p = problemOf(r, tenantOf(r), oneDayMove);
    by.set(p, [...(by.get(p) ?? []), r]);
  }
  const problems = [...by.entries()]
    .map(([problem, rs]) => {
      const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
      return {
        problem,
        reports: rs.length,
        tenants: new Set(rs.map((r) => r.tenant)).size,
        channels: rs.reduce<Record<string, number>>((n, r) => ({ ...n, [r.channel]: (n[r.channel] ?? 0) + 1 }), {}),
        firstSeen: days[0],
        lastSeen: days[days.length - 1],
      };
    })
    .sort((a, b) => b.reports - a.reports);
  return { rows: inTicket.length, unique: unique.length, problems };
}
