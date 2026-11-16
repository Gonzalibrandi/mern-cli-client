# PLAN — MERN-CLI-Client

> Deriva de [`SPEC.md`](SPEC.md). Define **cómo** se implementa.

## 1. Stack

| Necesidad              | Elección                         | Por qué                                                            |
|------------------------|----------------------------------|--------------------------------------------------------------------|
| Runtime                | Node.js 22+, JavaScript ESM      | Sin compilación; `fetch` y `AbortSignal.timeout` nativos.          |
| Prompts                | `@inquirer/prompts` 7            | Una sola librería para `select`, `input`, `password` y `editor`.   |
| Spinner                | `ora`                            | Recomendada por la consigna.                                       |
| Colores                | `picocolors`                     | Liviana, sin dependencias.                                         |
| Cajas                  | `boxen`                          | Bienvenida y pantalla del token.                                   |
| Tablas                 | `cli-table3`                     | Respuestas que son arreglos de objetos.                            |
| Resaltado JSON         | `cli-highlight`                  | Resaltado de sintaxis de la respuesta.                             |
| JWT                    | `jwt-decode`                     | Decodifica header y payload sin consultar al servidor.             |
| HTTP                   | `fetch` nativo                   | Cero dependencias; el tiempo se mide con `performance.now()`.      |
| Tests                  | `node:test`                      | Incluido en Node, sin dependencias.                                |

## 2. Arquitectura

Tres capas, cada una solo depende de la de abajo:

```
src/
├── index.js              Entrada: bienvenida, URL base, bucle del menú principal
├── screens/              Una pantalla por opción del menú (prompts + flujo)
│   ├── auth.js           RF-3  Login / registro
│   ├── request.js        RF-4  Constructor de peticiones
│   ├── history.js        RF-6  Historial y re-ejecución
│   └── token.js          RF-7  Estado del token / cerrar sesión
├── ui/                   Presentación reutilizable
│   ├── render.js         RF-5  Colores de estado, JSON resaltado, tablas (funciones puras → string)
│   ├── execute.js        RF-5  Spinner + envío + impresión de la respuesta
│   └── theme.js          RNF-3 Ayuda de teclas de los menús en español
└── core/                 Lógica sin interfaz (testeable)
    ├── storage.js        Lectura/escritura tolerante de archivos JSON
    ├── config.js         RF-1  `.mern-cli.json` (baseUrl + token)
    ├── history.js        RF-6  `.mern-cli-history.json` (últimas 10)
    ├── http.js           RF-4/5 `send()`: URL, headers, Bearer, timeout, medición
    └── jwt.js            RF-7  Decodificación, expiración y tiempo restante
```

**Estado:** un único objeto `config` (`{ baseUrl, token }`) cargado al inicio y pasado a cada pantalla. Quien lo modifica llama a `saveConfig(config)`.

**Cancelación (RF-2.4):** Inquirer lanza `ExitPromptError` ante Ctrl+C. El bucle del menú lo atrapa alrededor de cada pantalla (vuelve al menú); en el menú principal se propaga hasta `index.js`, que sale con código 0.

**Errores de red (RF-5.5):** `send()` lanza; `execute()` lo atrapa, detiene el spinner en rojo y devuelve `null`. Las pantallas nunca ven excepciones de red.

## 3. Tareas

| #  | Tarea                                                           | Cubre                    |
|----|-----------------------------------------------------------------|--------------------------|
| T1 | `package.json`, dependencias, `.gitignore`, script `start`/`bin` | RNF-2, RNF-5             |
| T2 | `core/storage.js` + `core/config.js`                            | RF-1, CA-01..03          |
| T3 | `core/http.js`                                                  | RF-3.6, RF-4.5, RF-5.2, RF-5.6, CA-08, CA-12 |
| T4 | `ui/render.js` + `ui/execute.js`                                | RF-5, CA-14..18          |
| T5 | `index.js` (bienvenida + menú)                                  | RF-1, RF-2, CA-04, CA-05 |
| T6 | `screens/auth.js`                                               | RF-3, CA-06, CA-07, CA-09, CA-10 |
| T7 | `screens/request.js`                                            | RF-4, CA-11..13          |
| T8 | `core/jwt.js` + `screens/token.js`                              | RF-7, CA-19..21          |
| T9 | `core/history.js` + `screens/history.js`                        | RF-6, CA-22..25          |
| T10| Tests unitarios de `core/` y `ui/render.js`                     | —                        |
