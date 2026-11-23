# Guion de la demo (12 minutos, sin diapositivas)

## Antes de empezar (no cuenta en el tiempo)

1. Abrir una terminal en la carpeta del proyecto.
2. Correr `npm run reiniciar` para partir de los datos ficticios.
3. Correr `npm start` y abrir http://localhost:3000 en el navegador.
4. Tener abiertos en el editor `datos/inventario.json` y `src/servicio.js`.

Valores iniciales esperados: 10 productos, 77 unidades y ₡5 815 900.

## Guion

| Minuto | Qué se hace | Qué se dice o se muestra |
| --- | --- | --- |
| 0:00–1:30 | Presentar el problema | Una tienda de camas, muebles y menaje lleva el inventario en papel: no sabe cuánto tiene ni cuánto vale, y registra salidas de mercadería que no existe. Usuario: el encargado de bodega. |
| 1:30–2:30 | Recorrer la pantalla | Totales arriba, formularios 1 y 2, tabla de existencias 3, resumen por categoría y últimos movimientos. Datos ficticios en CRC. |
| 2:30–4:00 | **RF-01** Registrar producto | Código `CAM-004`, nombre `Cama queen con gavetas`, categoría `Camas`, costo `230000`. Aparece en la tabla con existencia 0 y resaltado. |
| 4:00–5:30 | **RF-02** Entrada | Entrada de `5` unidades de CAM-004. Mensaje: "Existencia actual: 5". Valor total sube a ₡6 965 900. |
| 5:30–6:30 | **RF-02** Salida | Salida de `2` unidades. La existencia baja a 3 y el movimiento aparece arriba en "Últimos movimientos". |
| 6:30–8:00 | **Caso de error (RN-01)** | Salida de `9` unidades de CAM-004. Mensaje en rojo: "No hay suficiente existencia: hay 3 unidades de "Cama queen con gavetas" y se intentó sacar 9". La existencia no cambia. Luego intentar un producto con costo `-5000`: "El costo unitario no puede ser negativo". |
| 8:00–9:00 | **RF-03** Resumen y persistencia | Mostrar el resumen por categoría (Camas sube). Detener el servidor con Ctrl+C, volver a correr `npm start` y recargar: los datos siguen ahí. Mostrar `datos/inventario.json`. |
| 9:00–10:30 | **Pruebas automatizadas** | Correr `npm test`: 12 de 12 pasan. Señalar P-04b (5 de 5 salidas excesivas rechazadas) y P-05 (exactitud 100% en 20 movimientos), que son los indicadores de éxito. |
| 10:30–11:30 | Arquitectura y uso de IA | Mostrar que las reglas están en `src/servicio.js`, separadas de la pantalla. Contar un ciclo de docs/uso-ia.md donde la revisión humana cambió el rumbo. |
| 11:30–12:00 | Cierre | Beneficio para la tienda, limitaciones y siguiente paso (QR en las cajas, RF-04). |

## Plan B

- Si el navegador falla, mostrar la misma regla con `npm test`: P-04 y P-07a prueban el rechazo de la salida excesiva.
- Si el puerto 3000 está ocupado: `set PORT=4000 && npm start`.
- Si los datos quedaron desordenados por un ensayo: `npm run reiniciar`.
