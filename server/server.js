/* ============================================================
   Alaia Camp — servidor API (Express)
   Sirve el sitio estático + API REST + subida de imágenes.
   Correr:  cd server && npm install && npm start
   Luego abre  http://localhost:4000   (sitio)
               http://localhost:4000/admin.html  (panel)
   ============================================================ */
const path = require('path');
const fs = require('fs');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const db = require('./db');

const PORT = process.env.PORT || 4000;
const SECRET = process.env.JWT_SECRET || 'alaia-dev-secret-change-me';
const ROOT = path.resolve(__dirname, '..');           // raíz del sitio
const UPLOADS = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS)) fs.mkdirSync(UPLOADS, { recursive: true });

const app = express();
app.use(express.json({ limit: '2mb' }));

/* ---------- uploads (multer) ---------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS),
  filename: (req, file, cb) => {
    const ext = (path.extname(file.originalname) || '.jpg').toLowerCase();
    cb(null, 'p_' + Date.now() + '_' + Math.round(Math.random() * 1e6) + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 6 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, /image\//.test(file.mimetype))
});

/* ---------- auth helpers ---------- */
function sign(u) { return jwt.sign({ id: u._id, email: u.email, role: u.role, name: u.name }, SECRET, { expiresIn: '30d' }); }
function authReq(req, res, next) {
  const h = req.headers.authorization || '';
  const t = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!t) return res.status(401).json({ error: 'No autenticado' });
  try { req.user = jwt.verify(t, SECRET); next(); }
  catch (e) { return res.status(401).json({ error: 'Sesión inválida' }); }
}
function adminReq(req, res, next) { authReq(req, res, () => req.user.role === 'admin' ? next() : res.status(403).json({ error: 'Solo admin' })); }
const wrap = (fn) => (req, res) => Promise.resolve(fn(req, res)).catch(e => { console.error(e); res.status(500).json({ error: 'Error del servidor' }); });
const clean = (u) => u && ({ id: u._id, name: u.name, email: u.email, role: u.role });

/* =================== AUTH =================== */
app.get('/api/health', (req, res) => res.json({ ok: true, name: 'alaia-api', time: Date.now() }));

app.post('/api/auth/register', wrap(async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Correo y contraseña requeridos' });
  const exists = await db.users.findOne({ email: String(email).toLowerCase() });
  if (exists) return res.status(409).json({ error: 'Ese correo ya tiene cuenta' });
  const u = await db.users.insert({
    name: name || String(email).split('@')[0], email: String(email).toLowerCase(),
    passwordHash: bcrypt.hashSync(password, 10), role: 'parent', createdAt: Date.now()
  });
  res.json({ token: sign(u), user: clean(u) });
}));

app.post('/api/auth/login', wrap(async (req, res) => {
  const { email, password } = req.body || {};
  const u = await db.users.findOne({ email: String(email || '').toLowerCase() });
  if (!u || !bcrypt.compareSync(password || '', u.passwordHash)) return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
  res.json({ token: sign(u), user: clean(u) });
}));

app.get('/api/auth/me', authReq, wrap(async (req, res) => {
  const u = await db.users.findOne({ _id: req.user.id });
  res.json({ user: clean(u) });
}));

/* =================== PRODUCTOS =================== */
app.get('/api/products', wrap(async (req, res) => {
  const q = { active: { $ne: false } };
  if (req.query.cat && req.query.cat !== 'all') q.cat = req.query.cat;
  res.json(await db.products.find(q, { createdAt: -1 }));
}));

app.post('/api/products', adminReq, upload.single('image'), wrap(async (req, res) => {
  const b = req.body || {};
  const doc = {
    name: b.name || 'Producto', en: b.en || b.name || 'Product', cat: b.cat || 'accesorios',
    price: Number(b.price) || 0, desc: b.desc || '', den: b.den || b.desc || '',
    sizes: b.sizes ? String(b.sizes).split(',').map(s => s.trim()).filter(Boolean) : [],
    tag: b.tag || '', image: req.file ? '/uploads/' + req.file.filename : (b.image || ''),
    active: b.active === 'false' ? false : true, createdAt: Date.now()
  };
  res.json(await db.products.insert(doc));
}));

app.put('/api/products/:id', adminReq, upload.single('image'), wrap(async (req, res) => {
  const b = req.body || {};
  const set = {};
  ['name', 'en', 'cat', 'desc', 'den', 'tag'].forEach(k => { if (b[k] !== undefined) set[k] = b[k]; });
  if (b.price !== undefined) set.price = Number(b.price) || 0;
  if (b.sizes !== undefined) set.sizes = String(b.sizes).split(',').map(s => s.trim()).filter(Boolean);
  if (b.active !== undefined) set.active = !(b.active === 'false' || b.active === false);
  if (req.file) set.image = '/uploads/' + req.file.filename;
  await db.products.update({ _id: req.params.id }, { $set: set });
  res.json(await db.products.findOne({ _id: req.params.id }));
}));

app.delete('/api/products/:id', adminReq, wrap(async (req, res) => {
  await db.products.remove({ _id: req.params.id });
  res.json({ ok: true });
}));

/* =================== CAMPAMENTOS & BUNDLES =================== */
app.get('/api/camps', wrap(async (req, res) => res.json(await db.camps.find({ active: { $ne: false } }, { price: -1 }))));
app.post('/api/camps', adminReq, wrap(async (req, res) => {
  const b = req.body || {};
  res.json(await db.camps.insert({ es: b.es || 'Campamento', en: b.en || b.es || 'Camp', dates: b.dates || '', price: Number(b.price) || 0, active: true, createdAt: Date.now() }));
}));
app.put('/api/camps/:id', adminReq, wrap(async (req, res) => {
  const b = req.body || {}; const set = {};
  ['es', 'en', 'dates'].forEach(k => { if (b[k] !== undefined) set[k] = b[k]; });
  if (b.price !== undefined) set.price = Number(b.price) || 0;
  if (b.active !== undefined) set.active = !(b.active === 'false' || b.active === false);
  await db.camps.update({ _id: req.params.id }, { $set: set });
  res.json(await db.camps.findOne({ _id: req.params.id }));
}));
app.delete('/api/camps/:id', adminReq, wrap(async (req, res) => { await db.camps.remove({ _id: req.params.id }); res.json({ ok: true }); }));

app.get('/api/bundles', wrap(async (req, res) => res.json(await db.bundles.find({}, { price: 1 }))));

/* =================== CAMPERS (Camper Control) =================== */
app.get('/api/campers', authReq, wrap(async (req, res) => res.json(await db.campers.find({ userId: req.user.id }, { createdAt: -1 }))));

app.post('/api/campers', authReq, wrap(async (req, res) => {
  const b = req.body || {};
  if (!b.nombre) return res.status(400).json({ error: 'Falta el nombre del camper' });
  const doc = Object.assign({}, b, {
    userId: req.user.id,
    wristband: 'AC-' + Math.floor(100000 + Math.random() * 900000),
    ficha: true,
    pago: b.pago === 'paid' ? 'paid' : 'pend',
    createdAt: Date.now()
  });
  delete doc._id;
  const c = await db.campers.insert(doc);
  await db.notifications.insert({ userId: req.user.id, icon: '🎟️', title: 'Inscripción confirmada', en: 'Enrollment confirmed', body: (c.nombre + ' quedó inscrito. Pulsera ' + c.wristband + '.'), ben: (c.nombre + ' is enrolled. Wristband ' + c.wristband + '.'), when: 'Ahora', createdAt: Date.now() });
  res.json(c);
}));

app.put('/api/campers/:id', authReq, wrap(async (req, res) => {
  const c = await db.campers.findOne({ _id: req.params.id });
  if (!c || c.userId !== req.user.id) return res.status(404).json({ error: 'No encontrado' });
  const set = {}; const b = req.body || {};
  Object.keys(b).forEach(k => { if (k !== '_id' && k !== 'userId') set[k] = b[k]; });
  await db.campers.update({ _id: req.params.id }, { $set: set });
  res.json(await db.campers.findOne({ _id: req.params.id }));
}));

/* =================== PEDIDOS =================== */
app.post('/api/orders', wrap(async (req, res) => {
  const b = req.body || {};
  let userId = null;
  const h = req.headers.authorization || '';
  if (h.startsWith('Bearer ')) { try { userId = jwt.verify(h.slice(7), SECRET).id; } catch (e) {} }
  const doc = {
    userId, name: b.name || '', contact: b.contact || '', camper: b.camper || '',
    items: Array.isArray(b.items) ? b.items : [], total: Number(b.total) || 0,
    status: 'pendiente', code: 'ALA-' + Math.floor(100000 + Math.random() * 900000), createdAt: Date.now()
  };
  res.json(await db.orders.insert(doc));
}));
app.get('/api/orders', authReq, wrap(async (req, res) => res.json(await db.orders.find({ userId: req.user.id }, { createdAt: -1 }))));

/* =================== NOTIFICACIONES =================== */
app.get('/api/notifications', wrap(async (req, res) => {
  let userId = null;
  const h = req.headers.authorization || '';
  if (h.startsWith('Bearer ')) { try { userId = jwt.verify(h.slice(7), SECRET).id; } catch (e) {} }
  const q = userId ? { $or: [{ global: true }, { userId }] } : { global: true };
  res.json(await db.notifications.find(q, { createdAt: -1 }));
}));
app.post('/api/notifications', adminReq, wrap(async (req, res) => {
  const b = req.body || {};
  res.json(await db.notifications.insert({ global: true, icon: b.icon || '📣', title: b.title || 'Aviso del campamento', en: b.en || b.title || 'Camp update', body: b.body || '', ben: b.ben || b.body || '', when: 'Ahora', createdAt: Date.now() }));
}));

/* =================== ADMIN (lecturas) =================== */
app.get('/api/admin/stats', adminReq, wrap(async (req, res) => {
  res.json({
    products: await db.products.count({}), campers: await db.campers.count({}),
    parents: await db.users.count({ role: 'parent' }), orders: await db.orders.count({}),
    paid: await db.campers.count({ pago: 'paid' })
  });
}));
app.get('/api/admin/campers', adminReq, wrap(async (req, res) => {
  const campers = await db.campers.find({}, { createdAt: -1 });
  const users = await db.users.find({});
  const byId = {}; users.forEach(u => byId[u._id] = u);
  res.json(campers.map(c => Object.assign({}, c, { parent: byId[c.userId] ? { name: byId[c.userId].name, email: byId[c.userId].email } : null })));
}));
app.get('/api/admin/orders', adminReq, wrap(async (req, res) => res.json(await db.orders.find({}, { createdAt: -1 }))));

/* =================== STATIC (sitio) =================== */
app.use((req, res, next) => {           // no exponer código del servidor
  if (req.path.startsWith('/server') || req.path.startsWith('/.git')) return res.status(404).end();
  next();
});
app.use('/uploads', express.static(UPLOADS));
app.use(express.static(ROOT, { extensions: ['html'] }));

/* =================== SEED inicial =================== */
async function seed() {
  if (await db.users.count({ role: 'admin' }) === 0) {
    const email = process.env.ADMIN_EMAIL || 'admin@alaiacamp.mx';
    const pass = process.env.ADMIN_PASSWORD || 'alaia2026';
    await db.users.insert({ name: 'Administrador', email, passwordHash: bcrypt.hashSync(pass, 10), role: 'admin', createdAt: Date.now() });
    console.log('  ✓ admin creado:  ' + email + '  /  ' + pass);
  }
  if (await db.products.count({}) === 0) {
    const S = ['4', '6', '8', '10', '12', '14', 'CH', 'M', 'G'];
    const P = [
      { name: 'Playera clásica Alaia', en: 'Alaia classic tee', cat: 'ropa', price: 250, sizes: S, tag: 'Best seller', desc: 'Algodón premium, estampado 3D del sello de la orden.', den: 'Premium cotton, 3D order-seal print.' },
      { name: 'Playera Expedición', en: 'Expedition tee', cat: 'ropa', price: 270, sizes: S, desc: 'Mapa topográfico al frente, ruta de tesoro en la espalda.', den: 'Topographic map front, treasure route on the back.' },
      { name: 'Sudadera La Forja', en: 'La Forja hoodie', cat: 'ropa', price: 690, sizes: S, tag: 'Top calidad', desc: 'Felpa pesada, bordado 3D. La que se roban en casa.', den: 'Heavy fleece, 3D embroidery.' },
      { name: 'Short deportivo', en: 'Sport shorts', cat: 'ropa', price: 290, sizes: S, desc: 'Secado rápido para clínicas y nocturnos.', den: 'Quick-dry for clinics and night games.' },
      { name: 'Gorra bordada 3D', en: '3D embroidered cap', cat: 'accesorios', price: 300, sizes: [], tag: 'Favorita', desc: 'Bordado 3D de altísima calidad. Nada catimado.', den: 'Top-tier 3D embroidery.' },
      { name: 'Bucket hat', en: 'Bucket hat', cat: 'accesorios', price: 280, sizes: [], desc: 'Para el sol de Malinalco, con cordón ajustable.', den: 'For the Malinalco sun.' },
      { name: 'Termo 750 ml', en: 'Tumbler 750 ml', cat: 'accesorios', price: 320, sizes: [], tag: 'Must have', desc: 'Acero inoxidable, mantiene frío 24 h.', den: 'Stainless steel, keeps cold 24h.' },
      { name: 'Botella deportiva', en: 'Sport bottle', cat: 'accesorios', price: 180, sizes: [], desc: 'Ligera, a prueba de fugas, con nombre grabable.', den: 'Light, leak-proof.' },
      { name: 'Morral de campa', en: 'Camp tote', cat: 'accesorios', price: 260, sizes: [], desc: 'Lona resistente para cargar todo el día.', den: 'Tough canvas.' },
      { name: 'Llavero brújula', en: 'Compass keychain', cat: 'accesorios', price: 90, sizes: [], desc: 'Brújula real con el sello de Alaia.', den: 'Real compass with the Alaia seal.' },
      { name: 'Calcetas (3 pares)', en: 'Socks (3 pairs)', cat: 'ropa', price: 160, sizes: ['CH', 'M', 'G'], desc: 'Acolchadas, para senderismo y deporte.', den: 'Cushioned.' },
      { name: 'Pants de campa', en: 'Camp sweatpants', cat: 'ropa', price: 420, sizes: S, desc: 'Calientitos para las fogatas y tertulias.', den: 'Cozy for campfires.' }
    ];
    for (const p of P) await db.products.insert(Object.assign({ image: '', active: true, createdAt: Date.now() }, p));
    console.log('  ✓ ' + P.length + ' productos sembrados');
  }
  if (await db.camps.count({}) === 0) {
    await db.camps.insert({ es: 'Verano · Semana completa', en: 'Summer · Full week', dates: '19–25 jul 2026', price: 14900, active: true, createdAt: Date.now() });
    await db.camps.insert({ es: 'Verano · Media semana', en: 'Summer · Half week', dates: '19–22 jul 2026', price: 8900, active: true, createdAt: Date.now() });
  }
  if (await db.bundles.count({}) === 0) {
    await db.bundles.insert({ name: 'Kit Esencial', en: 'Essential Kit', tagline: 'Lo indispensable.', ten: 'The essentials.', price: 690, was: 830, hot: false, items: ['1 playera clásica', '1 gorra bordada 3D', '1 termo 750 ml'], iten: ['1 classic tee', '1 3D cap', '1 tumbler 750 ml'] });
    await db.bundles.insert({ name: 'Maleta de 3 días', en: '3-day Suitcase', tagline: 'Para que ensucie a gusto.', ten: 'So they can get gloriously dirty.', price: 1190, was: 1450, hot: true, items: ['3 playeras', '1 short deportivo', '1 gorra 3D', '1 termo', '1 llavero brújula'], iten: ['3 tees', '1 sport shorts', '1 3D cap', '1 tumbler', '1 compass keychain'] });
    await db.bundles.insert({ name: 'Maleta Completa', en: 'Full Suitcase', tagline: 'Yo te preparo todo.', ten: 'We pack it all.', price: 2290, was: 2980, hot: false, items: ['5 playeras', '2 shorts', '1 sudadera', '1 pants', '1 gorra + 1 bucket', '1 termo + 1 botella', '3 pares de calcetas', '1 morral'], iten: ['5 tees', '2 shorts', '1 hoodie', '1 sweatpants', '1 cap + 1 bucket', '1 tumbler + 1 bottle', '3 socks', '1 tote'] });
  }
  if (await db.notifications.count({}) === 0) {
    await db.notifications.insert({ global: true, icon: '🌞', title: 'Abierto el verano 2026', en: 'Summer 2026 is open', body: 'Del 19 al 25 de julio en Malinalco. Cupos limitados por tribu.', ben: 'July 19–25 in Malinalco. Limited spots per tribe.', when: 'Hace 2 días', createdAt: Date.now() - 2e8 });
  }
}

seed().then(() => {
  app.listen(PORT, () => {
    console.log('\n  Alaia Camp backend en  http://localhost:' + PORT);
    console.log('  Sitio:  http://localhost:' + PORT + '/');
    console.log('  Admin:  http://localhost:' + PORT + '/admin.html\n');
  });
}).catch(e => { console.error('Error al sembrar:', e); process.exit(1); });
