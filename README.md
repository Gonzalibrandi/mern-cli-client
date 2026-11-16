# MERN-CLI-Client

Cliente REST interactivo en terminal (TUI) para probar una API Express con autenticación JWT.
Especificación en [`SPEC.md`](SPEC.md) y diseño en [`PLAN.md`](PLAN.md).

## Uso

```bash
npm install
npm start
```

Requiere Node.js 22 o superior. La primera vez pide la URL base de la API (por defecto `http://localhost:4000/api`) y la guarda en `.mern-cli.json`.

- **↑/↓ + Enter:** navegar los menús.
- **Ctrl+C:** cancelar y volver al menú (en el menú principal, salir).
- **Body de POST/PUT:** se abre el editor de `$VISUAL`/`$EDITOR` (Notepad en Windows si no hay ninguno). Escribí el JSON, guardá y cerrá.

## Ejemplo de sesión

Contra el [backend de prueba](#backend-de-prueba). En la terminal, los estados se ven en color (verde 2xx, amarillo 4xx, rojo 5xx) y el JSON con resaltado de sintaxis.

```
╭─────────────────────────────────────────────╮
│  MERN-CLI-Client  Cliente REST en terminal  │
│                                             │
│  API: http://localhost:4000/api             │
╰─────────────────────────────────────────────╯
✔ Menú principal  ○ Sin sesión Iniciar sesión / Registrar usuario
✔ Autenticación Iniciar sesión
✔ Email: demo@demo.com
✔ Password: *******
● POST /auth/login  200 OK · 178 ms

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOi…",
  "user": { "id": "1", "email": "demo@demo.com" }
}

✔ Sesión iniciada. El token se enviará en todas las peticiones.

✔ Menú principal  ● Autenticado Ver estado del Token JWT actual (decodificado y tiempo restante)
╭ Token JWT ────────────────────────────╮
│                                       │
│   Header                              │
│   {                                   │
│     "alg": "HS256",                   │
│     "typ": "JWT"                      │
│   }                                   │
│                                       │
│   Payload                             │
│   {                                   │
│     "sub": "1",                       │
│     "email": "demo@demo.com",         │
│     "iat": 1794870501,                │
│     "exp": 1794874101                 │
│   }                                   │
│                                       │
│   Emitido: 16/11/2026, 08:08:21       │
│   Expira:  16/11/2026, 09:08:21       │
│   Estado:  Vigente · quedan 59m 51s   │
│                                       │
╰───────────────────────────────────────╯

✔ Menú principal  ● Autenticado Ejecutar petición personalizada (GET, POST, PUT, DELETE)
✔ Método HTTP GET
✔ Ruta relativa (ej. /productos): /productos
● GET /productos  200 OK · 15 ms

┌────┬───────────┬────────┬───────┬───────────────┐
│ id │ nombre    │ precio │ stock │ creadoPor     │
├────┼───────────┼────────┼───────┼───────────────┤
│ 1  │ Mate      │ 1500   │ 10    │ demo@demo.com │
├────┼───────────┼────────┼───────┼───────────────┤
│ 2  │ Termo     │ 9000   │ 4     │ demo@demo.com │
├────┼───────────┼────────┼───────┼───────────────┤
│ 3  │ Yerba 1kg │ 3200   │ 25    │ demo@demo.com │
└────┴───────────┴────────┴───────┴───────────────┘

✔ Menú principal  ● Autenticado Ejecutar petición personalizada (GET, POST, PUT, DELETE)
✔ Método HTTP POST
✔ Ruta relativa (ej. /productos): /productos
✔ Body JSON (se abre tu editor: escribí, guardá y cerrá)
● POST /productos  201 Created · 9 ms

{
  "id": "4",
  "nombre": "Bombilla",
  "precio": 800,
  "stock": 0,
  "creadoPor": "demo@demo.com"
}

● GET /productos/99  404 Not Found · 30 ms

{
  "message": "No existe un producto con id 99"
}

● GET /error  500 Internal Server Error · 28 ms

{
  "message": "Error interno del servidor"
}

✔ Menú principal  ● Autenticado Ver historial de peticiones recientes
✔ Historial (Enter para re-ejecutar) 16/11/2026, 08:08:48  GET    /productos → 200
● GET /productos  200 OK · 41 ms
…
✔ Menú principal  ● Autenticado Salir
¡Hasta luego!
```

Al volver a abrir la app, la URL y la sesión se recuperan de `.mern-cli.json`: el menú arranca en `● Autenticado` y el token sigue vigente.

## Contrato con el backend

| Endpoint                   | Body enviado            | Respuesta esperada (2xx)       |
|----------------------------|-------------------------|--------------------------------|
| `POST {baseUrl}/auth/login`    | `{ email, password }`   | `{ "token": "<jwt>", ... }`    |
| `POST {baseUrl}/auth/register` | `{ email, password }`   | opcionalmente `{ "token": ... }` |

Las demás peticiones llevan `Authorization: Bearer <token>` automáticamente.

## Backend de prueba

Si no tenés tu backend a mano, [`test-backend/`](test-backend/) trae una API Express con datos en memoria (se reinician en cada arranque) que cumple ese contrato.

```bash
npm install --prefix test-backend   # solo la primera vez
npm run backend                     # en una terminal
npm start                           # en otra terminal → Enter para aceptar http://localhost:4000/api
```

Usuario demo: **`demo@demo.com` / `demo123`**.

| Ruta                       | Auth | Qué hace                                                       |
|----------------------------|------|----------------------------------------------------------------|
| `POST /api/auth/register`  | —    | Crea usuario → `201 { token, user }` · `409` si el email existe |
| `POST /api/auth/login`     | —    | `200 { token, user }` · `401` si las credenciales son inválidas |
| `GET /api/productos`       | JWT  | Lista de productos (el cliente la muestra como tabla)          |
| `GET /api/productos/:id`   | JWT  | Un producto · `404` si no existe                               |
| `POST /api/productos`      | JWT  | Crea `{ nombre, precio, stock? }` · `400` si es inválido       |
| `PUT /api/productos/:id`   | JWT  | Reemplaza el producto                                          |
| `DELETE /api/productos/:id`| JWT  | Borra → `204` sin contenido                                    |
| `GET /api/error`           | —    | Siempre `500` (para ver el estado en rojo)                     |

Variables opcionales: `PORT` (4000), `JWT_SECRET`, `JWT_EXPIRES_IN` (`1h`; probá `2m` para ver el aviso de expiración en amarillo).

## Archivos locales

| Archivo                  | Contenido                                        |
|--------------------------|--------------------------------------------------|
| `.mern-cli.json`         | `baseUrl` y el `token` de la sesión               |
| `.mern-cli-history.json` | Últimas 10 peticiones (método, ruta, estado, fecha, body) |

Los dos están en `.gitignore`.

## Tests

```bash
npm test
```
