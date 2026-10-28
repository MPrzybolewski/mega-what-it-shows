<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import split from '#lib/data/tickets-4471.json';
  import { splitTicket } from '#lib/kb/split';
  import { tenantOf } from '#lib/kb/locales';
  import type { Report } from '#lib/kb/causes';

  let { ticket }: { ticket: number } = $props();

  const result = $derived(splitTicket(reports as Report[], ticket, tenantOf, notes.oneDayMove));
  const issues = split.tickets as Record<string, number>;
  const what: Record<string, string> = {
    parser: 'the shared parser reads day-first dates month first',
    hint: 'the booking-v3 form hint says MM/DD, the form reads day first',
    'one-day': 'the date moves by one day across time zones',
    unplaced: 'no tenant on file',
  };
  const channels = (c: Record<string, number>) =>
    Object.entries(c)
      .sort((a, b) => b[1] - a[1])
      .map(([ch, n]) => `${ch} ×${n}`)
      .join(' · ');
</script>

<p class="sum">
  <strong>{result.unique}</strong> reports in #{ticket}
  ({result.rows} rows in the export, {result.rows - result.unique} of them duplicates) ·
  <strong>{result.problems.length}</strong>
  {result.problems.length === 1 ? 'problem' : 'problems'}
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>tenants</th><th>came in by</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each result.problems as p (p.problem)}
      <tr>
        <td><code>{p.problem}</code><br /><span class="what">{what[p.problem]}</span></td>
        <td><strong>{p.reports}</strong></td>
        <td>{p.tenants}</td>
        <td class="ch">{channels(p.channels)}</td>
        <td>{p.firstSeen} → {p.lastSeen}</td>
        <td>
          {#if issues[p.problem]}
            <a href="{split.repo}/issues/{issues[p.problem]}">#{issues[p.problem]}</a>
          {:else}
            no ticket
          {/if}
        </td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .sum { font-size: 1.1rem; }
  .what, .ch { color: var(--muted); font-size: 0.85em; }
</style>
