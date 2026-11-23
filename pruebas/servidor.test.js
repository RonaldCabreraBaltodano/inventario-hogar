'use strict';

// Prueba de punta a punta por HTTP: la página usa exactamente estas rutas.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { crearServidor } = require('../src/servidor');
const { crearServicio } = require('../src/servicio');
const { crearRepositorioJSON } = require('../src/repositorio');

test('P-07a (RF-01 a RF-03) flujo completo por la API: producto, entrada, salida, consulta y error', async (t) => {
  const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'inventario-'));
  const servidor = crearServidor(crearServicio(crearRepositorioJSON(path.join(carpeta, 'inventario.json'))));
  await new Promise((r) => servidor.listen(0, r));
  t.after(() => {
    servidor.close();
    fs.rmSync(carpeta, { recursive: true, force: true });
  });
  const base = `http://127.0.0.1:${servidor.address().port}`;
  const enviar = (ruta, cuerpo) =>
    fetch(base + ruta, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) });

  let r = await enviar('/api/productos', { codigo: 'CAM-300', nombre: 'Cama king', categoria: 'Camas', costoUnitario: 300000 });
  assert.equal(r.status, 201);
  r = await enviar('/api/movimientos', { codigoProducto: 'CAM-300', tipo: 'entrada', cantidad: 5, fecha: '2026-11-23' });
  assert.equal(r.status, 201);
  r = await enviar('/api/movimientos', { codigoProducto: 'CAM-300', tipo: 'salida', cantidad: 2, fecha: '2026-11-23' });
  assert.equal((await r.json()).existencia, 3);

  r = await enviar('/api/movimientos', { codigoProducto: 'CAM-300', tipo: 'salida', cantidad: 9 });
  assert.equal(r.status, 400);
  assert.match((await r.json()).error, /No hay suficiente existencia/);

  const inventario = await (await fetch(base + '/api/inventario')).json();
  assert.equal(inventario.productos[0].existencia, 3);
  assert.equal(inventario.total.valor, 900000);

  const pagina = await fetch(base + '/');
  assert.equal(pagina.status, 200);
  assert.match(await pagina.text(), /Inventario/);
});

test('P-07b la API responde 400 con un mensaje claro si el JSON está mal formado', async (t) => {
  const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'inventario-'));
  const servidor = crearServidor(crearServicio(crearRepositorioJSON(path.join(carpeta, 'inventario.json'))));
  await new Promise((r) => servidor.listen(0, r));
  t.after(() => {
    servidor.close();
    fs.rmSync(carpeta, { recursive: true, force: true });
  });
  const r = await fetch(`http://127.0.0.1:${servidor.address().port}/api/productos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{esto no es json',
  });
  assert.equal(r.status, 400);
  assert.match((await r.json()).error, /no son JSON válido/);
});
