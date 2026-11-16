import { select } from '@inquirer/prompts';
import pc from 'picocolors';
import { HISTORY_LIMIT, loadHistory } from '../core/history.js';
import { executeAndRecord } from '../ui/execute.js';
import { formatHistoryEntry } from '../ui/render.js';
import { selectTheme } from '../ui/theme.js';

/** RF-6: lista las últimas peticiones; Enter sobre una la re-ejecuta con el token actual. */
export async function historyScreen(config) {
  const history = await loadHistory();
  if (history.length === 0) {
    console.log(pc.dim('No hay peticiones en el historial.\n'));
    return;
  }

  const entry = await select({
    message: 'Historial (Enter para re-ejecutar)',
    choices: [
      ...history.map((item) => ({ name: formatHistoryEntry(item), value: item })),
      { name: 'Volver', value: null },
    ],
    pageSize: HISTORY_LIMIT + 1,
    theme: selectTheme,
  });

  if (entry) await executeAndRecord(config, entry);
}
