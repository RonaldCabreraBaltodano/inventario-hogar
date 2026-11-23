'use strict';

// Servicio de inventario: aquí viven TODAS las reglas de negocio y los cálculos.
// No sabe nada de la pantalla ni del archivo: recibe un "repositorio" con
// cargar() y guardar(estado), y devuelve datos simples (números y textos).

class ErrorDeValidacion extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = 'ErrorDeValidacion';
  }
}

const TIPOS_DE_MOVIMIENTO = ['entrada', 'salida'];

function texto(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

// Convierte lo que llega del formulario a número. Devuelve null si no es un número.
function aNumero(valor) {
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : null;
  if (typeof valor === 'string' && valor.trim() !== '') {
    const numero = Number(valor.trim());
    return Number.isFinite(numero) ? numero : null;
  }
  return null;
}

function fechaDeHoy() {
  const ahora = new Date();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  return `${ahora.getFullYear()}-${mes}-${dia}`;
}

function esFechaValida(fecha) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const d = new Date(Date.UTC(anio, mes - 1, dia));
  return d.getUTCFullYear() === anio && d.getUTCMonth() === mes - 1 && d.getUTCDate() === dia;
}

// RF-01, RN-03 y RN-04: valida los datos de un producto nuevo.
function validarProducto(datos, productos) {
  const codigo = texto(datos.codigo).toUpperCase();
  const nombre = texto(datos.nombre);
  const categoria = texto(datos.categoria);

  if (!codigo) throw new ErrorDeValidacion('El código es obligatorio.');
  if (!/^[A-Z0-9-]{1,20}$/.test(codigo)) {
    throw new ErrorDeValidacion('El código solo puede tener letras, números y guiones (máximo 20 caracteres).');
  }
  if (!nombre) throw new ErrorDeValidacion('El nombre es obligatorio.');
  if (!categoria) throw new ErrorDeValidacion('La categoría es obligatoria.');

  const costo = aNumero(datos.costoUnitario);
  if (costo === null) throw new ErrorDeValidacion('El costo unitario debe ser un número.');
  if (costo < 0) throw new ErrorDeValidacion('El costo unitario no puede ser negativo.');
  if (!Number.isInteger(costo)) throw new ErrorDeValidacion('El costo unitario debe estar en colones enteros.');

  if (productos.some((p) => p.codigo === codigo)) {
    throw new ErrorDeValidacion(`Ya existe un producto con el código ${codigo}.`);
  }
  return { codigo, nombre, categoria, costoUnitario: costo };
}

// RF-03: la existencia se calcula siempre a partir de los movimientos
// (entradas menos salidas), así nunca se descuadra con el historial.
function calcularExistencia(codigo, movimientos) {
  return movimientos
    .filter((m) => m.codigoProducto === codigo)
    .reduce((total, m) => total + (m.tipo === 'entrada' ? m.cantidad : -m.cantidad), 0);
}

// RF-02, RN-01 y RN-02: valida un movimiento antes de aceptarlo.
function validarMovimiento(datos, productos, movimientos, hoy) {
  const codigo = texto(datos.codigoProducto).toUpperCase();
  const producto = productos.find((p) => p.codigo === codigo);
  if (!producto) throw new ErrorDeValidacion(`No existe un producto con el código ${codigo || '(vacío)'}.`);

  const tipo = texto(datos.tipo).toLowerCase();
  if (!TIPOS_DE_MOVIMIENTO.includes(tipo)) throw new ErrorDeValidacion('El tipo debe ser "entrada" o "salida".');

  const cantidad = aNumero(datos.cantidad);
  if (cantidad === null) throw new ErrorDeValidacion('La cantidad debe ser un número.');
  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    throw new ErrorDeValidacion('La cantidad debe ser un número entero mayor que cero.');
  }

  const fecha = texto(datos.fecha) || hoy();
  if (!esFechaValida(fecha)) throw new ErrorDeValidacion('La fecha debe tener el formato AAAA-MM-DD.');

  if (tipo === 'salida') {
    const existencia = calcularExistencia(codigo, movimientos);
    if (cantidad > existencia) {
      throw new ErrorDeValidacion(
        `No hay suficiente existencia: hay ${existencia} unidades de "${producto.nombre}" y se intentó sacar ${cantidad}.`
      );
    }
  }
  return { codigoProducto: codigo, tipo, cantidad, fecha };
}

// RF-03 y RN-04: existencias, valor en CRC y resumen por categoría.
function resumenDeInventario(estado) {
  const productos = estado.productos
    .map((p) => {
      const existencia = calcularExistencia(p.codigo, estado.movimientos);
      return { ...p, existencia, valor: existencia * p.costoUnitario };
    })
    .sort((a, b) => a.codigo.localeCompare(b.codigo));

  const porCategoria = new Map();
  for (const p of productos) {
    const c = porCategoria.get(p.categoria) || { categoria: p.categoria, productos: 0, unidades: 0, valor: 0 };
    c.productos += 1;
    c.unidades += p.existencia;
    c.valor += p.valor;
    porCategoria.set(p.categoria, c);
  }
  const categorias = [...porCategoria.values()].sort((a, b) => a.categoria.localeCompare(b.categoria));

  return {
    productos,
    categorias,
    total: {
      productos: productos.length,
      unidades: productos.reduce((t, p) => t + p.existencia, 0),
      valor: productos.reduce((t, p) => t + p.valor, 0),
    },
  };
}

function crearServicio(repositorio, opciones = {}) {
  const hoy = opciones.hoy || fechaDeHoy;

  return {
    registrarProducto(datos = {}) {
      const estado = repositorio.cargar();
      const producto = validarProducto(datos, estado.productos);
      estado.productos.push(producto);
      repositorio.guardar(estado);
      return { ...producto, existencia: 0, valor: 0 };
    },

    registrarMovimiento(datos = {}) {
      const estado = repositorio.cargar();
      const valido = validarMovimiento(datos, estado.productos, estado.movimientos, hoy);
      const id = estado.movimientos.reduce((max, m) => Math.max(max, m.id), 0) + 1;
      const movimiento = { id, ...valido };
      estado.movimientos.push(movimiento);
      repositorio.guardar(estado);
      return { movimiento, existencia: calcularExistencia(movimiento.codigoProducto, estado.movimientos) };
    },

    consultarExistencias() {
      return resumenDeInventario(repositorio.cargar());
    },

    listarMovimientos(limite = 15) {
      const { productos, movimientos } = repositorio.cargar();
      const nombres = new Map(productos.map((p) => [p.codigo, p.nombre]));
      return [...movimientos]
        .sort((a, b) => b.id - a.id)
        .slice(0, limite)
        .map((m) => ({ ...m, nombreProducto: nombres.get(m.codigoProducto) || '' }));
    },
  };
}

module.exports = { crearServicio, calcularExistencia, resumenDeInventario, ErrorDeValidacion };
