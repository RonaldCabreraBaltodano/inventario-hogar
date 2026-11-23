'use strict';

// Pruebas automatizadas del servicio de inventario.
// Comando: npm test   (equivale a: node --test)

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { crearServicio, ErrorDeValidacion } = require('../src/servicio');
const { crearRepositorioJSON } = require('../src/repositorio');

const SEMILLA = path.join(__dirname, '..', 'datos', 'semilla.json');

// Repositorio en memoria para probar las reglas sin tocar archivos.
function repositorioEnMemoria(inicial = { productos: [], movimientos: [] }) {
  let guardado = JSON.parse(JSON.stringify(inicial));
  return {
    cargar: () => JSON.parse(JSON.stringify(guardado)),
    guardar: (estado) => { guardado = JSON.parse(JSON.stringify(estado)); },
  };
}

function servicioCon(inicial) {
  return crearServicio(repositorioEnMemoria(inicial), { hoy: () => '2026-11-23' });
}

function servicioConUnaCama() {
  const servicio = servicioCon();
  servicio.registrarProducto({ codigo: 'CAM-100', nombre: 'Cama prueba', categoria: 'Camas', costoUnitario: 100000 });
  return servicio;
}

function existenciaDe(servicio, codigo) {
  return servicio.consultarExistencias().productos.find((p) => p.codigo === codigo).existencia;
}

test('P-01 (RF-01) registrar un producto válido: queda en el catálogo con existencia 0', () => {
  const servicio = servicioCon();
  const producto = servicio.registrarProducto({ codigo: 'cam-100', nombre: ' Cama queen ', categoria: 'Camas', costoUnitario: '150000' });
  assert.deepEqual(producto, { codigo: 'CAM-100', nombre: 'Cama queen', categoria: 'Camas', costoUnitario: 150000, existencia: 0, valor: 0 });
  assert.equal(servicio.consultarExistencias().productos.length, 1);
});

test('P-02 (RF-01, RN-03, RN-04) código repetido, nombre vacío o costo negativo se rechazan', () => {
  const servicio = servicioConUnaCama();
  const casos = [
    [{ codigo: 'CAM-100', nombre: 'Otra', categoria: 'Camas', costoUnitario: 1 }, /Ya existe un producto con el código CAM-100/],
    [{ codigo: 'CAM-101', nombre: '   ', categoria: 'Camas', costoUnitario: 1 }, /nombre es obligatorio/],
    [{ codigo: 'CAM-102', nombre: 'Cama', categoria: 'Camas', costoUnitario: -5000 }, /no puede ser negativo/],
    [{ codigo: 'CAM-103', nombre: 'Cama', categoria: 'Camas', costoUnitario: 'abc' }, /debe ser un número/],
    [{ codigo: '', nombre: 'Cama', categoria: 'Camas', costoUnitario: 1 }, /código es obligatorio/],
    [{ codigo: 'CAM-104', nombre: 'Cama', categoria: '', costoUnitario: 1 }, /categoría es obligatoria/],
  ];
  for (const [datos, mensaje] of casos) {
    assert.throws(() => servicio.registrarProducto(datos), (e) => e instanceof ErrorDeValidacion && mensaje.test(e.message));
  }
  assert.equal(servicio.consultarExistencias().productos.length, 1, 'el catálogo no debe cambiar');
});

test('P-03 (RF-02) una entrada de 10 y una salida de 4 dejan la existencia en 6', () => {
  const servicio = servicioConUnaCama();
  assert.equal(servicio.registrarMovimiento({ codigoProducto: 'CAM-100', tipo: 'entrada', cantidad: 10 }).existencia, 10);
  const resultado = servicio.registrarMovimiento({ codigoProducto: 'CAM-100', tipo: 'salida', cantidad: 4 });
  assert.equal(resultado.existencia, 6);
  assert.equal(resultado.movimiento.fecha, '2026-11-23', 'sin fecha se usa la de hoy');
  assert.equal(existenciaDe(servicio, 'CAM-100'), 6);
});

test('P-04 (RN-01, RN-02) salida mayor que la existencia y cantidades inválidas se rechazan sin cambiar la existencia', () => {
  const servicio = servicioConUnaCama();
  servicio.registrarMovimiento({ codigoProducto: 'CAM-100', tipo: 'entrada', cantidad: 6 });

  assert.throws(
    () => servicio.registrarMovimiento({ codigoProducto: 'CAM-100', tipo: 'salida', cantidad: 7 }),
    /No hay suficiente existencia: hay 6 unidades de "Cama prueba" y se intentó sacar 7/
  );
  for (const cantidad of [0, -3, 'abc', 2.5, '']) {
    assert.throws(
      () => servicio.registrarMovimiento({ codigoProducto: 'CAM-100', tipo: 'entrada', cantidad }),
      ErrorDeValidacion,
      `la cantidad ${JSON.stringify(cantidad)} debe rechazarse`
    );
  }
  assert.throws(() => servicio.registrarMovimiento({ codigoProducto: 'NO-EXISTE', tipo: 'entrada', cantidad: 1 }), /No existe un producto/);
  assert.throws(() => servicio.registrarMovimiento({ codigoProducto: 'CAM-100', tipo: 'devolucion', cantidad: 1 }), /"entrada" o "salida"/);
  assert.throws(() => servicio.registrarMovimiento({ codigoProducto: 'CAM-100', tipo: 'entrada', cantidad: 1, fecha: '2026-02-30' }), /formato AAAA-MM-DD/);

  assert.equal(existenciaDe(servicio, 'CAM-100'), 6, 'la existencia sigue en 6');
});

test('P-04b (indicador) cinco salidas excesivas: 100% rechazadas y ninguna existencia negativa', () => {
  const servicio = servicioCon(JSON.parse(fs.readFileSync(SEMILLA, 'utf8')));
  const intentos = [['CAM-001', 8], ['MUE-001', 4], ['COC-002', 12], ['BAN-001', 17], ['DEC-001', 100]];
  let rechazadas = 0;
  for (const [codigo, cantidad] of intentos) {
    try {
      servicio.registrarMovimiento({ codigoProducto: codigo, tipo: 'salida', cantidad });
    } catch (e) {
      if (e instanceof ErrorDeValidacion) rechazadas += 1;
    }
  }
  assert.equal(rechazadas, 5);
  assert.ok(servicio.consultarExistencias().productos.every((p) => p.existencia >= 0));
});

test('P-05 (RF-03, indicador de exactitud) las existencias de los 20 movimientos ficticios coinciden con el cálculo manual', () => {
  const semilla = JSON.parse(fs.readFileSync(SEMILLA, 'utf8'));
  assert.equal(semilla.movimientos.length, 20);
  const servicio = servicioCon(semilla);

  // Calculado a mano: entradas menos salidas de cada producto en datos/semilla.json.
  const esperado = {
    'CAM-001': 7, 'CAM-002': 7, 'CAM-003': 4,
    'MUE-001': 3, 'MUE-002': 2, 'MUE-003': 12,
    'COC-001': 9, 'COC-002': 11, 'BAN-001': 16, 'DEC-001': 6,
  };
  const obtenido = Object.fromEntries(servicio.consultarExistencias().productos.map((p) => [p.codigo, p.existencia]));
  assert.deepEqual(obtenido, esperado);
});

test('P-06 (persistencia) los datos siguen iguales al guardar y volver a abrir el archivo JSON', (t) => {
  const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'inventario-'));
  t.after(() => fs.rmSync(carpeta, { recursive: true, force: true }));
  const archivo = path.join(carpeta, 'inventario.json');

  const primero = crearServicio(crearRepositorioJSON(archivo), { hoy: () => '2026-11-23' });
  primero.registrarProducto({ codigo: 'DEC-900', nombre: 'Espejo', categoria: 'Decoración', costoUnitario: 22000 });
  primero.registrarMovimiento({ codigoProducto: 'DEC-900', tipo: 'entrada', cantidad: 3 });

  // Un servicio nuevo, como si se cerrara y abriera la aplicación.
  const segundo = crearServicio(crearRepositorioJSON(archivo));
  const inventario = segundo.consultarExistencias();
  assert.equal(inventario.productos.length, 1);
  assert.equal(inventario.productos[0].existencia, 3);
  assert.equal(segundo.listarMovimientos().length, 1);
});

test('P-06b (persistencia) la primera vez se copian los datos ficticios de la semilla', (t) => {
  const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'inventario-'));
  t.after(() => fs.rmSync(carpeta, { recursive: true, force: true }));
  const servicio = crearServicio(crearRepositorioJSON(path.join(carpeta, 'inventario.json'), SEMILLA));
  assert.equal(servicio.consultarExistencias().productos.length, 10);
  assert.ok(fs.existsSync(path.join(carpeta, 'inventario.json')));
});

test('P-10 (RN-04) valor del inventario en CRC y resumen por categoría', () => {
  const servicio = servicioCon();
  servicio.registrarProducto({ codigo: 'CAM-200', nombre: 'Cama individual', categoria: 'Camas', costoUnitario: 150000 });
  servicio.registrarProducto({ codigo: 'MUE-200', nombre: 'Silla', categoria: 'Muebles', costoUnitario: 25000 });
  servicio.registrarMovimiento({ codigoProducto: 'CAM-200', tipo: 'entrada', cantidad: 6 });
  servicio.registrarMovimiento({ codigoProducto: 'MUE-200', tipo: 'entrada', cantidad: 4 });

  const { categorias, total } = servicio.consultarExistencias();
  assert.deepEqual(categorias, [
    { categoria: 'Camas', productos: 1, unidades: 6, valor: 900000 },
    { categoria: 'Muebles', productos: 1, unidades: 4, valor: 100000 },
  ]);
  assert.deepEqual(total, { productos: 2, unidades: 10, valor: 1000000 });
});

test('P-10b (RN-04) resumen por categoría de los datos ficticios', () => {
  const servicio = servicioCon(JSON.parse(fs.readFileSync(SEMILLA, 'utf8')));
  const { categorias, total } = servicio.consultarExistencias();
  const valores = Object.fromEntries(categorias.map((c) => [c.categoria, c.valor]));
  assert.deepEqual(valores, { 'Baño': 200000, Camas: 3095000, Cocina: 718500, 'Decoración': 113400, Muebles: 1689000 });
  assert.deepEqual(total, { productos: 10, unidades: 77, valor: 5815900 });
});
