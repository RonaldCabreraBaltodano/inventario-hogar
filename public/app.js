'use strict';

// Presentación: solo pide datos al servidor y los muestra.
// Ningún cálculo de negocio se hace aquí; las reglas están en src/servicio.js.

const colones = new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 });
const enteros = new Intl.NumberFormat('es-CR');
const $ = (id) => document.getElementById(id);

function celda(texto, clase) {
  const td = document.createElement('td');
  td.textContent = texto;
  if (clase) td.className = clase;
  return td;
}

function fila(celdas, claseFila) {
  const tr = document.createElement('tr');
  if (claseFila) tr.className = claseFila;
  celdas.forEach((c) => tr.appendChild(c));
  return tr;
}

function mostrarMensaje(id, texto, tipo) {
  const p = $(id);
  p.textContent = texto;
  p.className = `mensaje ${tipo}`;
}

async function pedir(ruta, cuerpo) {
  const opciones = cuerpo
    ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) }
    : {};
  let respuesta;
  try {
    respuesta = await fetch(ruta, opciones);
  } catch {
    throw new Error('No hay conexión con el servidor. ¿Está corriendo "npm start"?');
  }
  const datos = await respuesta.json();
  if (!respuesta.ok) throw new Error(datos.error || 'Error desconocido.');
  return datos;
}

function pintar(inventario, resaltar) {
  $('total-productos').textContent = enteros.format(inventario.total.productos);
  $('total-unidades').textContent = enteros.format(inventario.total.unidades);
  $('total-valor').textContent = colones.format(inventario.total.valor);

  const existencias = $('tabla-existencias');
  existencias.replaceChildren(
    ...inventario.productos.map((p) => {
      const clases = [p.codigo === resaltar ? 'resaltado' : '', p.existencia === 0 ? 'agotado' : ''].join(' ').trim();
      return fila([
        celda(p.codigo),
        celda(p.nombre),
        celda(p.categoria),
        celda(colones.format(p.costoUnitario), 'num'),
        celda(enteros.format(p.existencia), 'num existencia'),
        celda(colones.format(p.valor), 'num'),
      ], clases);
    })
  );

  const categorias = $('tabla-categorias');
  categorias.replaceChildren(
    ...inventario.categorias.map((c) =>
      fila([celda(c.categoria), celda(enteros.format(c.productos), 'num'), celda(enteros.format(c.unidades), 'num'), celda(colones.format(c.valor), 'num')])
    ),
    fila([celda('Total'), celda(enteros.format(inventario.total.productos), 'num'), celda(enteros.format(inventario.total.unidades), 'num'), celda(colones.format(inventario.total.valor), 'num')], 'total')
  );
  categorias.lastChild.querySelectorAll('td').forEach((td) => { td.style.fontWeight = '700'; });

  $('tabla-movimientos').replaceChildren(
    ...inventario.movimientos.map((m) =>
      fila([celda(String(m.id)), celda(m.fecha), celda(`${m.codigoProducto} · ${m.nombreProducto}`), celda(m.tipo, m.tipo), celda(enteros.format(m.cantidad), 'num')])
    )
  );

  const select = $('select-producto');
  const elegido = select.value;
  select.replaceChildren(
    ...inventario.productos.map((p) => {
      const o = document.createElement('option');
      o.value = p.codigo;
      o.textContent = `${p.codigo} · ${p.nombre} (hay ${p.existencia})`;
      return o;
    })
  );
  if (resaltar && inventario.productos.some((p) => p.codigo === resaltar)) select.value = resaltar;
  else if (elegido) select.value = elegido;

  $('lista-categorias').replaceChildren(
    ...inventario.categorias.map((c) => {
      const o = document.createElement('option');
      o.value = c.categoria;
      return o;
    })
  );
}

async function refrescar(resaltar) {
  pintar(await pedir('/api/inventario'), resaltar);
}

function hoyLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

$('form-producto').addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const form = evento.target;
  const datos = Object.fromEntries(new FormData(form));
  try {
    const producto = await pedir('/api/productos', datos);
    form.reset();
    mostrarMensaje('msg-producto', `Producto ${producto.codigo} guardado con existencia 0.`, 'ok');
    await refrescar(producto.codigo);
  } catch (error) {
    mostrarMensaje('msg-producto', error.message, 'error');
  }
});

$('form-movimiento').addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const form = evento.target;
  const datos = Object.fromEntries(new FormData(form));
  const cantidad = form.elements.cantidad;
  try {
    const { movimiento, existencia } = await pedir('/api/movimientos', datos);
    cantidad.value = '';
    cantidad.classList.remove('invalido');
    const verbo = movimiento.tipo === 'entrada' ? 'Entraron' : 'Salieron';
    mostrarMensaje('msg-movimiento', `${verbo} ${movimiento.cantidad} unidades de ${movimiento.codigoProducto}. Existencia actual: ${existencia}.`, 'ok');
    await refrescar(movimiento.codigoProducto);
  } catch (error) {
    cantidad.classList.add('invalido');
    mostrarMensaje('msg-movimiento', error.message, 'error');
  }
});

document.querySelector('#form-movimiento input[name="fecha"]').value = hoyLocal();
refrescar().catch((error) => mostrarMensaje('msg-movimiento', error.message, 'error'));
