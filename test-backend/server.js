// Backend de prueba para MERN-CLI-Client.
// Datos en memoria: se reinician cada vez que se levanta el servidor.
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import express from 'express';
import { expressjwt } from 'express-jwt';
import jwt from 'jsonwebtoken';
import morgan from 'morgan';

const PORT = Number(process.env.PORT ?? 4000);
const JWT_SECRET = process.env.JWT_SECRET ?? 'secreto-de-desarrollo';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '1h';

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const isNonEmptyString = (value) => typeof value === 'string' && value.trim() !== '';

// ─── Usuarios ────────────────────────────────────────────────────────────────

const users = [];

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  return timingSafeEqual(Buffer.from(hash, 'hex'), scryptSync(password, salt, 64));
}

const findUser = (email) => users.find((user) => user.email === email.trim().toLowerCase());

function addUser(email, password) {
  const user = { id: String(users.length + 1), email: email.trim().toLowerCase(), passwordHash: hashPassword(password) };
  users.push(user);
  return user;
}

const publicUser = ({ id, email }) => ({ id, email });
const signToken = (user) => jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

// ─── Productos ───────────────────────────────────────────────────────────────

const productos = [];
let nextProductoId = 1;

/** Valida el body de POST/PUT y devuelve solo los campos permitidos. */
function parseProducto(body) {
  const { nombre, precio, stock = 0 } = body ?? {};
  if (!isNonEmptyString(nombre)) throw new HttpError(400, '"nombre" es obligatorio');
  if (typeof precio !== 'number' || precio < 0) throw new HttpError(400, '"precio" debe ser un número mayor o igual a 0');
  if (!Number.isInteger(stock) || stock < 0) throw new HttpError(400, '"stock" debe ser un entero mayor o igual a 0');
  return { nombre: nombre.trim(), precio, stock };
}

function findProducto(id) {
  const producto = productos.find((p) => p.id === id);
  if (!producto) throw new HttpError(404, `No existe un producto con id ${id}`);
  return producto;
}

function addProducto(data, creadoPor) {
  const producto = { id: String(nextProductoId++), ...data, creadoPor };
  productos.push(producto);
  return producto;
}

// ─── Datos iniciales ─────────────────────────────────────────────────────────

const DEMO = { email: 'demo@demo.com', password: 'demo123' };
addUser(DEMO.email, DEMO.password);
addProducto({ nombre: 'Mate', precio: 1500, stock: 10 }, DEMO.email);
addProducto({ nombre: 'Termo', precio: 9000, stock: 4 }, DEMO.email);
addProducto({ nombre: 'Yerba 1kg', precio: 3200, stock: 25 }, DEMO.email);

// ─── Rutas ───────────────────────────────────────────────────────────────────

const auth = express.Router();

auth.post('/register', (req, res) => {
  const { email, password } = req.body ?? {};
  if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
    throw new HttpError(400, 'email y password son obligatorios');
  }
  if (findUser(email)) throw new HttpError(409, 'El email ya está registrado');

  const user = addUser(email, password);
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

auth.post('/login', (req, res) => {
  const { email, password } = req.body ?? {};
  const user = isNonEmptyString(email) && findUser(email);
  if (!user || typeof password !== 'string' || !verifyPassword(password, user.passwordHash)) {
    throw new HttpError(401, 'Credenciales inválidas');
  }
  res.json({ token: signToken(user), user: publicUser(user) });
});

// Todas las rutas de productos exigen JWT; express-jwt deja el payload en req.auth.
const productosRouter = express.Router();
productosRouter.use(expressjwt({ secret: JWT_SECRET, algorithms: ['HS256'] }));

productosRouter.get('/', (req, res) => res.json(productos));

productosRouter.get('/:id', (req, res) => res.json(findProducto(req.params.id)));

productosRouter.post('/', (req, res) => {
  res.status(201).json(addProducto(parseProducto(req.body), req.auth.email));
});

productosRouter.put('/:id', (req, res) => {
  const producto = findProducto(req.params.id);
  Object.assign(producto, parseProducto(req.body));
  res.json(producto);
});

productosRouter.delete('/:id', (req, res) => {
  productos.splice(productos.indexOf(findProducto(req.params.id)), 1);
  res.status(204).end();
});

const api = express.Router();
api.use('/auth', auth);
api.use('/productos', productosRouter);
// Ruta pública para ver un 5xx (en rojo) en el cliente.
api.get('/error', () => {
  throw new Error('Error de prueba');
});

// ─── App ─────────────────────────────────────────────────────────────────────

const app = express();
app.use(morgan('dev'));
app.use(express.json());
app.use('/api', api);

app.use((req, res) => {
  res.status(404).json({ message: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
});

// Manejador de errores centralizado: HttpError, express-jwt (401) y express.json (400) traen `status`.
app.use((err, req, res, next) => {
  const status = err.status ?? 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ message: status >= 500 ? 'Error interno del servidor' : err.message });
});

app.listen(PORT, () => {
  console.log(`Backend de prueba en http://localhost:${PORT}/api`);
  console.log(`Usuario demo: ${DEMO.email} / ${DEMO.password}`);
});
