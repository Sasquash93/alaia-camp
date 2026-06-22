/* ============================================================
   Alaia Camp — capa de datos
   Modelo de documentos estilo MongoDB. Hoy usa una base embebida
   y persistente en disco (@seald-io/nedb) para correr sin instalar
   nada. Para producción: apunta MONGO_URL a MongoDB Atlas y se
   migra esta capa sin tocar las rutas (misma forma de documentos).
   ============================================================ */
const path = require('path');
const fs = require('fs');
const Datastore = require('@seald-io/nedb');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function open(name) {
  const d = new Datastore({ filename: path.join(DATA_DIR, name + '.db'), autoload: true });
  return {
    insert: (doc) => new Promise((res, rej) => d.insert(doc, (e, n) => e ? rej(e) : res(n))),
    find: (q = {}, sort) => new Promise((res, rej) => {
      let c = d.find(q); if (sort) c = c.sort(sort);
      c.exec((e, docs) => e ? rej(e) : res(docs));
    }),
    findOne: (q) => new Promise((res, rej) => d.findOne(q, (e, doc) => e ? rej(e) : res(doc))),
    update: (q, u, o = {}) => new Promise((res, rej) => d.update(q, u, o, (e, n) => e ? rej(e) : res(n))),
    remove: (q, o = {}) => new Promise((res, rej) => d.remove(q, o, (e, n) => e ? rej(e) : res(n))),
    count: (q = {}) => new Promise((res, rej) => d.count(q, (e, n) => e ? rej(e) : res(n))),
    raw: d
  };
}

module.exports = {
  users: open('users'),
  products: open('products'),
  camps: open('camps'),
  bundles: open('bundles'),
  campers: open('campers'),
  orders: open('orders'),
  notifications: open('notifications'),
  DATA_DIR
};
