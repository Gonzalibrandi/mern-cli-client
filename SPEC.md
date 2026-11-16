# SPEC — MERN-CLI-Client (Cliente REST en Terminal)

> **Metodología:** Spec-Driven Development (SDD).
> Este documento define **qué** debe hacer la aplicación y **cómo se verifica** que lo hace.
> El **cómo se implementa** (arquitectura, módulos, tareas) va en `PLAN.md` y `TASKS.md`, que se derivan de este spec.
>
> **Fuente:** consigna "ACTIVIDAD PROPUESTA – MERN-CLI-Client" (PDF *Middlewares populares del ecosistema MERN*).
> Cada requisito indica entre corchetes la parte de la consigna de la que sale: `[C1]` … `[C5]`.
> Lo que la consigna no define y hubo que decidir está marcado como **(Decisión)** y listado en la §9.

---

## 1. Objetivo

Desarrollar una aplicación interactiva en consola (**TUI – Text User Interface**) que permita a un desarrollador:

1. Autenticarse contra **su propio backend** Node.js/Express.
2. Gestionar **automáticamente** el token JWT, en memoria o en disco.
3. Realizar operaciones **CRUD** (GET, POST, PUT, DELETE) sobre sus endpoints protegidos.

## 2. Usuario y contexto de uso

- **Usuario:** un desarrollador que está construyendo una API MERN y quiere probarla sin salir de la terminal.
- **Backend objetivo:** una API Express con autenticación JWT, típicamente en `http://localhost:4000/api`.
- **Entorno:** Node.js 18+ (fetch nativo), terminal con soporte de colores y teclas de flecha (Windows Terminal, PowerShell, bash, zsh).

## 3. Historias de usuario

| ID    | Como desarrollador quiero…                                                                 | Para…                                                      |
|-------|--------------------------------------------------------------------------------------------|------------------------------------------------------------|
| HU-01 | configurar la URL base de mi API una sola vez                                              | no tener que escribirla en cada ejecución                  |
| HU-02 | navegar un menú con las flechas del teclado                                                | operar la app rápido y sin errores de tipeo                |
| HU-03 | iniciar sesión (o registrarme) con email y password sin que se vea la contraseña           | obtener un JWT de forma segura                             |
| HU-04 | que el token se adjunte solo en cada petición                                              | no copiar/pegar el `Authorization` a mano                  |
| HU-05 | armar una petición eligiendo método, ruta y body JSON                                      | probar cualquier endpoint CRUD de mi API                   |
| HU-06 | ver la respuesta con colores, tiempo de respuesta y formato legible (JSON o tabla)         | entender rápido qué devolvió el servidor                   |
| HU-07 | ver el estado de mi token (payload decodificado y tiempo restante)                         | saber si mi sesión sigue vigente sin consultar al servidor |
| HU-08 | ver las últimas peticiones y re-ejecutar una con Enter                                     | repetir pruebas sin volver a cargarlas                     |

---

## 4. Requerimientos funcionales

### RF-1 — Configuración inicial `[C1]`

- **RF-1.1** Al iniciar, la app busca el archivo local **`.mern-cli.json`**.
- **RF-1.2** Si el archivo existe y tiene una `baseUrl` válida, la carga y la muestra en la cabecera de bienvenida.
- **RF-1.3** Si el archivo no existe (o no tiene `baseUrl`), la app **solicita** la URL base de la API (sugerencia por defecto: `http://localhost:4000/api`) y la guarda en `.mern-cli.json`.
- **RF-1.4** La URL ingresada se valida: debe ser una URL absoluta con protocolo `http://` o `https://`. Si es inválida, se informa el error y se vuelve a pedir.
- **RF-1.5** Si `.mern-cli.json` existe pero contiene JSON inválido, la app lo informa y lo trata como si no existiera (vuelve a pedir la URL), sin crashear.
- **RF-1.6** La `baseUrl` se normaliza quitando la `/` final, para que `baseUrl + ruta` no produzca `//`.

### RF-2 — Menú principal `[C1]`

- **RF-2.1** Tras la configuración se muestra un **menú interactivo navegable con las flechas del teclado** (↑/↓ para moverse, Enter para elegir) con exactamente estas opciones, en este orden:
  1. `Iniciar sesión / Registrar usuario`
  2. `Ejecutar petición personalizada (GET, POST, PUT, DELETE)`
  3. `Ver historial de peticiones recientes`
  4. `Ver estado del Token JWT actual (decodificado y tiempo restante)`
  5. `Salir`
- **RF-2.2** Al terminar cualquier opción (excepto `Salir`) la app vuelve al menú principal.
- **RF-2.3** `Salir` termina el proceso con código de salida `0`.
- **RF-2.4** Si el usuario cancela un prompt con Ctrl+C, la app vuelve al menú principal; Ctrl+C en el menú principal cierra la app limpiamente (sin stack trace).
- **RF-2.5** El menú indica de forma visible si hay una sesión activa (ej.: `● Autenticado` en verde / `○ Sin sesión` en gris).

### RF-3 — Autenticación JWT `[C2]`

- **RF-3.1** La opción 1 muestra un submenú seleccionable: `Iniciar sesión` / `Registrar usuario` / `Volver`.
- **RF-3.2** **Iniciar sesión** pide:
  - `email` (input de texto, no vacío, con formato de email).
  - `password` (input **enmascarado**: los caracteres no se muestran en pantalla).
- **RF-3.3** Envía `POST {baseUrl}/auth/login` con body JSON `{ "email": "...", "password": "..." }` y header `Content-Type: application/json`.
- **RF-3.4** Si la respuesta es **2xx**, la app **captura el JWT** del campo `token` del body JSON (`{ "token": "<jwt>", ... }`). Este es el contrato que el backend debe cumplir **(Decisión D2)**.
- **RF-3.5** El token capturado se **almacena localmente**: en memoria durante la ejecución y en disco en `.mern-cli.json` (campo `token`) para sobrevivir reinicios **(Decisión)**.
- **RF-3.6** A partir de ese momento, **todas las peticiones posteriores** incluyen automáticamente el header `Authorization: Bearer <token>`.
- **RF-3.7** Si la respuesta del login es 2xx pero el body no tiene un campo `token` de tipo string, se informa en amarillo ("Login OK pero la respuesta no incluye el campo \"token\"") y se muestra la respuesta.
- **RF-3.8** Si la respuesta no es 2xx, se muestra el código de estado y el mensaje de error del servidor; el token anterior (si había) no se modifica.
- **RF-3.9** **Registrar usuario** pide `email` y `password` (enmascarado) y envía `POST {baseUrl}/auth/register` con `{ "email", "password" }` **(Decisión D1)**. Si la respuesta 2xx incluye `token`, se aplica el mismo comportamiento que en login (RF-3.4 a RF-3.6); si no, se informa el éxito y se sugiere iniciar sesión.
- **RF-3.10** Las peticiones de login/registro se muestran con el mismo spinner y formato de respuesta que RF-5.
- **RF-3.11** Las peticiones de login/registro **no** se guardan en el historial (su body contiene la contraseña).

### RF-4 — Constructor de peticiones HTTP `[C3]`

- **RF-4.1** Permite elegir el método HTTP desde una **lista seleccionable**: `GET`, `POST`, `PUT`, `DELETE`.
- **RF-4.2** Solicita la **ruta relativa** (ej. `/productos`, `/usuarios/64ab3...`).
  - No puede estar vacía.
  - Si no empieza con `/`, se le antepone automáticamente.
  - Puede incluir query string (`/productos?page=2`).
- **RF-4.3** Si el método es **POST o PUT**, la app abre un **editor de texto** para escribir el body (el definido en `$VISUAL`/`$EDITOR`; si no hay ninguno, el del sistema: Notepad en Windows, vi en Unix), precargado con `{}`.
  - El contenido se **valida con `JSON.parse()` antes de enviar**. Si es inválido, se muestra el mensaje de error del parser y se vuelve a abrir el editor (no se envía nada).
  - El body debe ser un objeto o arreglo JSON.
- **RF-4.4** Para GET y DELETE no se pide body.
- **RF-4.5** La petición se envía a `{baseUrl}{ruta}` con:
  - `Authorization: Bearer <token>` si hay token (RF-3.6).
  - `Content-Type: application/json` cuando hay body.
  - `Accept: application/json`.
- **RF-4.6** Si no hay token, la petición se envía igual (sin header `Authorization`) y se muestra un aviso en amarillo: "Enviando sin token".
- **RF-4.7** Toda petición ejecutada desde el constructor (exitosa, con error HTTP o con error de red) se registra en el historial (RF-6).

### RF-5 — Visualización enriquecida de la respuesta `[C4]`

- **RF-5.1** Mientras la petición está en curso se muestra un **indicador animado (spinner)** con el texto `MÉTODO ruta…`.
- **RF-5.2** Se **mide el tiempo de respuesta en milisegundos** (desde el envío hasta recibir el body completo) y se muestra junto al estado, ej.: `200 OK · 87 ms`.
- **RF-5.3** El **código de estado HTTP** se renderiza con **código de colores**:

  | Rango | Color                    |
  |-------|--------------------------|
  | 2xx   | **verde**                |
  | 4xx   | **amarillo**             |
  | 5xx   | **rojo**                 |
  | 1xx / 3xx | cian **(Decisión)**  |

- **RF-5.4** Formato del body de la respuesta:
  - Si es un **arreglo de objetos** (no vacío, todos sus elementos son objetos planos) → se muestra **en formato tabla**, con una columna por clave (unión de las claves de todos los objetos). Los valores anidados (objetos/arreglos) se muestran como JSON compacto y truncado.
  - Si es cualquier otro JSON → se muestra **con indentación (2 espacios) y resaltado de sintaxis**.
  - Si el body no es JSON → se muestra como texto plano.
  - Si el body está vacío (ej. `204 No Content`) → se muestra `(sin contenido)`.
- **RF-5.5** Si ocurre un **error de red** (servidor caído, DNS, conexión rechazada, timeout), el spinner se detiene en estado de fallo y se muestra un mensaje en **rojo** con la causa (ej. `ECONNREFUSED http://localhost:4000`). La app no crashea y vuelve al menú.
- **RF-5.6** Timeout de petición: 15 segundos **(Decisión)**.

### RF-6 — Historial de peticiones `[C1]` `[C5 – Desafío extra]`

- **RF-6.1** Se guardan las **últimas 10 peticiones ejecutadas** en un **archivo JSON local**: `.mern-cli-history.json`.
- **RF-6.2** Cada entrada guarda como mínimo: **método, ruta, estado y fecha** (ISO 8601). Además guarda el `body` enviado (si lo hubo) para poder re-ejecutar POST/PUT **(Decisión D3)**.
- **RF-6.3** Al agregar una entrada nueva, si hay más de 10 se descarta la más antigua (FIFO). El orden es de más reciente a más antigua.
- **RF-6.4** La opción `Ver historial de peticiones recientes` muestra el historial como **lista seleccionable**, con una línea por entrada:
  `[fecha] MÉTODO /ruta → estado (coloreado según RF-5.3)`
  más una opción final `Volver`.
- **RF-6.5** Al seleccionar una entrada y presionar **Enter**, la petición se **re-ejecuta** (mismo método, ruta y body), con el token **actual**, mostrando spinner y respuesta como en RF-5. La re-ejecución también se agrega al historial.
- **RF-6.6** Si el historial está vacío se muestra "No hay peticiones en el historial" y se vuelve al menú.
- **RF-6.7** Si `.mern-cli-history.json` no existe o está corrupto, se trata como historial vacío (sin crashear).
- **RF-6.8** Las peticiones con error de red se registran con estado `"ERR"`.

### RF-7 — Estado del token JWT `[C1]`

- **RF-7.1** La opción `Ver estado del Token JWT actual` decodifica el token **localmente** (sin consultar al servidor) y muestra, dentro de una caja con borde:
  - **Header** decodificado (ej. `alg`, `typ`).
  - **Payload** decodificado, formateado como JSON con resaltado.
  - **Emitido** (`iat`) como fecha legible, si existe.
  - **Expira** (`exp`) como fecha legible, si existe.
  - **Tiempo restante** en formato legible (ej. `2h 13m 05s`).
- **RF-7.2** Estado del token con color:
  - Vigente con más de 5 minutos → verde.
  - Vigente con 5 minutos o menos → amarillo **(Decisión)**.
  - Expirado → rojo, indicando hace cuánto expiró y sugiriendo volver a iniciar sesión.
  - Sin claim `exp` → aviso "El token no tiene fecha de expiración".
- **RF-7.3** Si no hay token → "No hay sesión activa. Iniciá sesión desde el menú."
- **RF-7.4** Si el token no es un JWT decodificable → mensaje de error en rojo, sin crashear.
- **RF-7.5** La pantalla ofrece la acción `Cerrar sesión (borrar token)` además de `Volver` **(Decisión)**; cerrar sesión elimina el token de memoria y de `.mern-cli.json`.

---

## 5. Modelo de datos

### 5.1 `.mern-cli.json` (configuración + sesión)

Ubicación: directorio desde el que se ejecuta la app.

```json
{
  "baseUrl": "http://localhost:4000/api",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

| Campo     | Tipo            | Obligatorio | Descripción                                   |
|-----------|-----------------|-------------|-----------------------------------------------|
| `baseUrl` | string (URL)    | sí          | URL base de la API, sin `/` final.            |
| `token`   | string \| null  | no          | Último JWT obtenido. `null`/ausente = sin sesión. |

### 5.2 `.mern-cli-history.json` (historial)

```json
[
  {
    "method": "POST",
    "path": "/productos",
    "status": 201,
    "date": "2026-11-16T18:42:10.123Z",
    "durationMs": 87,
    "body": { "nombre": "Mate", "precio": 1500 }
  }
]
```

| Campo        | Tipo                            | Obligatorio (consigna) | Descripción                                      |
|--------------|---------------------------------|------------------------|--------------------------------------------------|
| `method`     | `"GET"\|"POST"\|"PUT"\|"DELETE"` | **sí**                 | Método HTTP.                                     |
| `path`       | string                          | **sí**                 | Ruta relativa (con query string si la tenía).    |
| `status`     | number \| `"ERR"`               | **sí**                 | Código HTTP, o `"ERR"` si hubo error de red.     |
| `date`       | string (ISO 8601)               | **sí**                 | Fecha y hora de ejecución.                       |
| `durationMs` | number                          | no                     | Tiempo de respuesta medido.                      |
| `body`       | JSON \| ausente                 | no                     | Body enviado (solo POST/PUT), para re-ejecutar.  |

Máximo 10 entradas, ordenadas de más reciente a más antigua.

---

## 6. Requerimientos no funcionales

- **RNF-1 — Robustez:** ningún error esperable (red, JSON inválido, archivo corrupto, token inválido, cancelación de prompt) debe terminar la app con un stack trace. Se muestra un mensaje claro y se vuelve al menú.
- **RNF-2 — Seguridad:**
  - La contraseña nunca se muestra en pantalla, ni se guarda en disco, ni en el historial.
  - `.mern-cli.json` y `.mern-cli-history.json` deben estar en `.gitignore` (contienen el token y datos de prueba).
- **RNF-3 — Usabilidad:** toda la navegación es por teclado (flechas + Enter); los mensajes de la interfaz están en **español**.
- **RNF-4 — Plataforma:** funciona en Node.js 22+ en Windows, macOS y Linux.
- **RNF-5 — Arranque:** se ejecuta con un único comando (`npm start` y/o `npx mern-cli`).

## 7. Restricciones técnicas (librerías recomendadas por la consigna)

La implementación debe elegir sus librerías dentro de las recomendadas por la consigna. La elección final se fija en `PLAN.md`.

| Necesidad                          | Opciones de la consigna                                 |
|------------------------------------|---------------------------------------------------------|
| Menús, inputs, password, navegación | `@clack/prompts`, `@inquirer/prompts`, `ink`, `blessed` |
| Colores                            | `picocolors` o `chalk`                                  |
| Cajas (bienvenida, token)          | `boxen`                                                 |
| Tablas                             | `cli-table3`                                            |
| Resaltado de JSON                  | `cardinal` o `cli-highlight`                            |
| Spinner                            | `ora` (o el spinner de la librería de prompts)          |
| Cliente HTTP + medición de tiempo  | `axios`, `ofetch` o `fetch` nativo (Node 18+)           |
| Decodificar JWT                    | `jose` o `jwt-decode`                                   |

> RF-4.3 pide "abrir un editor de texto"; `@inquirer/prompts` trae un prompt `editor` listo para eso (y con validación), cosa que `@clack/prompts` no tiene.

## 8. Criterios de aceptación

Formato *Dado / Cuando / Entonces*. La app se considera terminada cuando **todos** pasan.

**Configuración y menú**
- **CA-01** Dado que no existe `.mern-cli.json`, cuando inicio la app, entonces me pide la URL base, y al ingresar `http://localhost:4000/api` se crea `.mern-cli.json` con esa `baseUrl`.
- **CA-02** Dado que existe `.mern-cli.json` con `baseUrl`, cuando inicio la app, entonces no me pide la URL y va directo al menú.
- **CA-03** Cuando ingreso `localhost:4000` (sin protocolo) como URL, entonces se muestra un error y se vuelve a pedir.
- **CA-04** Dado el menú principal, entonces veo las 5 opciones de RF-2.1 en orden y puedo moverme con ↑/↓ y elegir con Enter.
- **CA-05** Cuando elijo `Salir`, entonces el proceso termina con código 0.

**Autenticación**
- **CA-06** Cuando inicio sesión, entonces al escribir la contraseña no se ven los caracteres.
- **CA-07** Dado un backend que responde a `POST /auth/login` con `200 { "token": "<jwt>" }`, cuando inicio sesión con credenciales válidas, entonces el token se guarda en `.mern-cli.json` y el menú indica `Autenticado`.
- **CA-08** Dado que inicié sesión, cuando ejecuto `GET /productos`, entonces la petición incluye `Authorization: Bearer <jwt>`.
- **CA-09** Dado que inicié sesión, cuando cierro y vuelvo a abrir la app, entonces sigo autenticado.
- **CA-10** Cuando el login responde `401`, entonces veo el `401` en amarillo con el mensaje del servidor y no se guarda ningún token.

**Constructor de peticiones**
- **CA-11** Cuando elijo `POST` e ingreso `{ nombre: "x" }` (JSON inválido) como body, entonces veo el error de `JSON.parse()` y se me vuelve a pedir el body sin enviar nada.
- **CA-12** Cuando elijo `POST`, ruta `productos` y body `{"nombre":"x"}`, entonces se envía `POST {baseUrl}/productos` con ese body y `Content-Type: application/json`.
- **CA-13** Cuando elijo `GET` o `DELETE`, entonces no se me pide body.

**Respuesta**
- **CA-14** Mientras la petición está en curso veo un spinner; al terminar veo el estado y el tiempo en ms.
- **CA-15** Una respuesta 2xx muestra el estado en verde, una 4xx en amarillo y una 5xx en rojo.
- **CA-16** Cuando la respuesta es `[{ "id": 1, "nombre": "A" }, { "id": 2, "nombre": "B" }]`, entonces se muestra como tabla con columnas `id` y `nombre`.
- **CA-17** Cuando la respuesta es un objeto JSON, entonces se muestra indentado y con colores de sintaxis.
- **CA-18** Dado que el backend está apagado, cuando ejecuto una petición, entonces veo un error de conexión en rojo y vuelvo al menú sin que la app se cierre.

**Token**
- **CA-19** Dado un token con `exp` dentro de 1 hora, cuando abro `Ver estado del Token`, entonces veo header, payload, fecha de expiración y un tiempo restante cercano a `59m` en verde.
- **CA-20** Dado un token expirado, entonces el estado se muestra en rojo indicando que expiró.
- **CA-21** Dado que no hay token, entonces veo "No hay sesión activa".

**Historial (desafío extra)**
- **CA-22** Después de ejecutar 12 peticiones, `.mern-cli-history.json` contiene exactamente las 10 más recientes, cada una con `method`, `path`, `status` y `date`.
- **CA-23** Cuando abro el historial, selecciono una entrada y presiono Enter, entonces la petición se vuelve a ejecutar (mismo método, ruta y body) y se muestra la respuesta.
- **CA-24** Dado que el historial está vacío, cuando lo abro, entonces veo "No hay peticiones en el historial".
- **CA-25** Las peticiones de login/registro no aparecen en el historial (nunca se guarda la contraseña).

## 9. Decisiones

Puntos que la consigna no define, resueltos con la opción más simple que cumple los requisitos.

| #   | Punto                                   | Decisión                                                                                   |
|-----|-----------------------------------------|--------------------------------------------------------------------------------------------|
| D1  | Endpoint de registro                    | `POST /auth/register` con `{ email, password }`, simétrico a `/auth/login`.                 |
| D2  | Dónde viene el token                    | Campo `token` del body JSON. Es la convención más común en MERN y un único contrato claro. |
| D3  | Body en el historial                    | Se guarda: sin él no se puede re-ejecutar un POST/PUT, que es lo que pide la consigna.     |
| D4  | Dónde se guarda el token                | Memoria + `.mern-cli.json`, así la sesión sobrevive reinicios.                             |
| D5  | Entrada del body                        | Solo editor de texto (la librería valida y lo reabre si el JSON es inválido).              |
| D6  | Lenguaje                                | JavaScript ESM, sin paso de compilación.                                                   |
| D7  | Color para 1xx/3xx                      | Cian.                                                                                      |
| D8  | Timeout de las peticiones               | 15 s.                                                                                      |
| D9  | Cerrar sesión                           | Acción dentro de la pantalla del token (no agrega opciones al menú principal).             |

## 10. Fuera de alcance

- Métodos distintos de GET, POST, PUT, DELETE (PATCH, HEAD, OPTIONS).
- Headers personalizados por petición, subida de archivos (`multipart/form-data`).
- Refresh tokens, OAuth, autenticación por cookies de sesión.
- Múltiples perfiles/entornos de `baseUrl` simultáneos.
- Interfaz multi-panel (estilo `blessed`): la app es secuencial basada en prompts.
- Construir el backend: la app consume una API Express existente.

## 11. Próximos pasos (SDD)

1. **`PLAN.md`**: stack definitivo, estructura de módulos y tareas, cada una ligada a los RF/CA que cubre.
2. **Implementar** tarea por tarea, verificando contra los criterios de aceptación de §8.
