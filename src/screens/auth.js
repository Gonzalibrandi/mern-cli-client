import { input, password, select } from '@inquirer/prompts';
import pc from 'picocolors';
import { saveConfig } from '../core/config.js';
import { isSuccess } from '../core/http.js';
import { execute } from '../ui/execute.js';
import { selectTheme } from '../ui/theme.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** RF-3: login / registro. El token devuelto en `{ token }` queda en memoria y en disco. */
export async function authScreen(config) {
  const action = await select({
    message: 'Autenticación',
    choices: [
      { name: 'Iniciar sesión', value: 'login' },
      { name: 'Registrar usuario', value: 'register' },
      { name: 'Volver', value: null },
    ],
    theme: selectTheme,
  });
  if (!action) return;

  const email = await input({
    message: 'Email:',
    validate: (value) => EMAIL_PATTERN.test(value.trim()) || 'Ingresá un email válido',
  });
  const pass = await password({
    message: 'Password:',
    mask: '*',
    validate: (value) => value.length > 0 || 'La contraseña no puede estar vacía',
  });

  // Login y registro no van al historial: el body contiene la contraseña (RF-3.11).
  const response = await execute(config, {
    method: 'POST',
    path: `/auth/${action}`,
    body: { email: email.trim(), password: pass },
  });
  if (!response || !isSuccess(response.status)) return;

  const token = response.data?.token;
  if (typeof token === 'string') {
    config.token = token;
    await saveConfig(config);
    console.log(pc.green('✔ Sesión iniciada. El token se enviará en todas las peticiones.\n'));
  } else if (action === 'login') {
    console.log(pc.yellow('⚠ Login OK pero la respuesta no incluye el campo "token".\n'));
  } else {
    console.log(pc.green('✔ Usuario registrado. Ahora iniciá sesión.\n'));
  }
}
