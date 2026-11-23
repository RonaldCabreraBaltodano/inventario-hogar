'use strict';

// Repositorio: lo único que sabe leer y escribir el archivo JSON.
// No aplica reglas de negocio.

const fs = require('node:fs');
const path = require('node:path');

function crearRepositorioJSON(rutaArchivo, rutaSemilla) {
  function asegurarArchivo() {
    if (fs.existsSync(rutaArchivo)) return true;
    if (rutaSemilla && fs.existsSync(rutaSemilla)) {
      fs.mkdirSync(path.dirname(rutaArchivo), { recursive: true });
      fs.copyFileSync(rutaSemilla, rutaArchivo);
      return true;
    }
    return false;
  }

  return {
    cargar() {
      if (!asegurarArchivo()) return { productos: [], movimientos: [] };
      let datos;
      try {
        datos = JSON.parse(fs.readFileSync(rutaArchivo, 'utf8'));
      } catch (error) {
        throw new Error(`El archivo de datos ${rutaArchivo} está dañado o no es JSON válido.`);
      }
      if (!datos || !Array.isArray(datos.productos) || !Array.isArray(datos.movimientos)) {
        throw new Error(`El archivo de datos ${rutaArchivo} no tiene "productos" y "movimientos".`);
      }
      return datos;
    },

    guardar(estado) {
      fs.mkdirSync(path.dirname(rutaArchivo), { recursive: true });
      // Se escribe primero en un archivo temporal y luego se renombra,
      // para no dejar el archivo a medias si algo falla al guardar.
      const temporal = `${rutaArchivo}.tmp`;
      fs.writeFileSync(temporal, JSON.stringify(estado, null, 2), 'utf8');
      fs.renameSync(temporal, rutaArchivo);
    },
  };
}

module.exports = { crearRepositorioJSON };
