'use strict';

// Servidor web: recibe las solicitudes de la página, llama al servicio
// y devuelve JSON. No calcula nada por su cuenta.

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { crearServicio, ErrorDeValidacion } = require('./servicio');
const { crearRepositorioJSON } = require('./repositorio');

const CARPETA_PUBLICA = path.join(__dirname, '..', 'public');
const ARCHIVOS_PUBLICOS = {
  '/': { archivo: 'index.html', tipo: 'text/html; charset=utf-8' },
  '/index.html': { archivo: 'index.html', tipo: 'text/html; charset=utf-8' },
  '/app.js': { archivo: 'app.js', tipo: 'text/javascript; charset=utf-8' },
  '/estilos.css': { archivo: 'estilos.css', tipo: 'text/css; charset=utf-8' },
};
const LIMITE_CUERPO = 10 * 1024;

function responderJSON(res, estado, cuerpo) {
  res.writeHead(estado, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(cuerpo));
}

function leerCuerpoJSON(req) {
  return new Promise((resolve, reject) => {
    let datos = '';
    req.setEncoding('utf8');
    req.on('data', (parte) => {
      datos += parte;
      if (datos.length > LIMITE_CUERPO) {
        reject(new ErrorDeValidacion('La solicitud es demasiado grande.'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(datos ? JSON.parse(datos) : {});
      } catch {
        reject(new ErrorDeValidacion('Los datos enviados no son JSON válido.'));
      }
    });
    req.on('error', reject);
  });
}

function crearServidor(servicio) {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    try {
      if (req.method === 'GET' && ARCHIVOS_PUBLICOS[url.pathname]) {
        const { archivo, tipo } = ARCHIVOS_PUBLICOS[url.pathname];
        res.writeHead(200, { 'Content-Type': tipo });
        res.end(fs.readFileSync(path.join(CARPETA_PUBLICA, archivo)));
        return;
      }
      if (req.method === 'GET' && url.pathname === '/api/inventario') {
        responderJSON(res, 200, { ...servicio.consultarExistencias(), movimientos: servicio.listarMovimientos() });
        return;
      }
      if (req.method === 'POST' && url.pathname === '/api/productos') {
        responderJSON(res, 201, servicio.registrarProducto(await leerCuerpoJSON(req)));
        return;
      }
      if (req.method === 'POST' && url.pathname === '/api/movimientos') {
        responderJSON(res, 201, servicio.registrarMovimiento(await leerCuerpoJSON(req)));
        return;
      }
      responderJSON(res, 404, { error: 'Ruta no encontrada.' });
    } catch (error) {
      if (error instanceof ErrorDeValidacion) {
        responderJSON(res, 400, { error: error.message });
      } else {
        console.error(error);
        responderJSON(res, 500, { error: 'Ocurrió un error interno. Revise la consola del servidor.' });
      }
    }
  });
}

if (require.main === module) {
  const raiz = path.join(__dirname, '..');
  const repositorio = crearRepositorioJSON(
    path.join(raiz, 'datos', 'inventario.json'),
    path.join(raiz, 'datos', 'semilla.json')
  );
  const puerto = Number(process.env.PORT) || 3000;
  crearServidor(crearServicio(repositorio)).listen(puerto, () => {
    console.log(`Inventario Hogar listo en http://localhost:${puerto}`);
  });
}

module.exports = { crearServidor };
