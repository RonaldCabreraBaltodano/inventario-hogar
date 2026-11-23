'use strict';

// Vuelve los datos al estado inicial ficticio (útil antes de la demo).
const fs = require('node:fs');
const path = require('node:path');

const carpeta = path.join(__dirname, '..', 'datos');
fs.copyFileSync(path.join(carpeta, 'semilla.json'), path.join(carpeta, 'inventario.json'));
console.log('Datos reiniciados: datos/inventario.json es igual a datos/semilla.json.');
