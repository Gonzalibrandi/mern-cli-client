import pc from 'picocolors';

const ACTIONS_ES = { navigate: 'navegar', select: 'elegir' };

/** Tema para los `select` de Inquirer con la ayuda de teclas en español (RNF-3). */
export const selectTheme = {
  style: {
    keysHelpTip: (keys) =>
      keys.map(([key, action]) => `${pc.bold(key)} ${pc.dim(ACTIONS_ES[action] ?? action)}`).join(pc.dim(' • ')),
  },
};
