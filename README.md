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
