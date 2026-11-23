# Intent: Inventario Hogar

Proyecto final individual del curso SINT-732, Laboratorio Ejecutivo en Claude Code (Universidad CENFOTEC).
Autor: Ronny. Fecha de entrega: 24 de noviembre de 2026.

## Problema

Una tienda costarricense de camas, muebles y artículos para el hogar (menaje) lleva sus existencias en una hoja o en papel.

*Supuesto:* no sabe con certeza cuántas unidades tiene de cada producto ni cuánto vale su inventario. Además, se registran salidas de mercadería que no existe, lo que deja existencias en negativo y descuadra el inventario.

## Usuario

*Supuesto:* el encargado de bodega o el dueño de la tienda. Registra lo que entra (compras) y lo que sale (ventas o despachos), y necesita consultar al momento la existencia y el valor del inventario.

## Proceso de principio a fin

Registrar producto → registrar entradas y salidas → consultar existencias, valor y resumen por categoría.

## Alcance

**Dentro**
- Catálogo de productos con código, nombre, categoría y costo unitario en colones (CRC).
- Registro de entradas y salidas con fecha y cantidad.
- Consulta de existencias, valor del inventario y resumen por categoría.
- Datos persistentes en un archivo JSON.
- Validación de entradas inválidas con un mensaje claro.
- Datos ficticios.

**Opcional (RF-04, idea de Ronny):** un código QR pegado en las cajas que, al leerlo, muestre la ficha del producto. Se construye solo si queda tiempo después de RF-01 a RF-03 (tarea T-14).

**Fuera:** usuarios y contraseñas, facturación, impuestos, varias bodegas, proveedores e integración con otros sistemas.

## Indicadores de éxito

| Indicador | Meta | Método de medición |
| --- | --- | --- |
| Exactitud de existencias | 100% de coincidencia en los 20 movimientos ficticios | Prueba automatizada P-05: compara la existencia del sistema con el cálculo manual (entradas − salidas) de `datos/semilla.json` |
| Rechazo de salidas inválidas | 5 de 5 salidas excesivas rechazadas y 0 existencias negativas | Prueba automatizada P-04b: intenta 5 salidas mayores que la existencia y verifica que todas se rechacen |

Comando para medir ambos: `npm test`.
