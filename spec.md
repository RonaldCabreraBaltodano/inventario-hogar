# Spec: Inventario Hogar

## Requisitos funcionales

| ID | Requisito | Criterios de aceptación observables |
| --- | --- | --- |
| RF-01 | Registrar producto | Al guardar código, nombre, categoría y costo unitario en CRC, el producto aparece en la tabla de existencias con existencia 0 y la pantalla muestra "Producto … guardado con existencia 0". Si el código está repetido, el nombre o la categoría están vacíos, o el costo es negativo o no numérico, se muestra el error en rojo y no se guarda nada. |
| RF-02 | Registrar entrada o salida | Una entrada de 10 unidades sube la existencia en 10 y una salida de 4 la baja en 4. La fila del producto se resalta. Si la cantidad es cero, negativa, decimal o no numérica, se rechaza con mensaje. Una salida mayor que la existencia se rechaza (RN-01) con el mensaje "No hay suficiente existencia: hay X unidades… y se intentó sacar Y". |
| RF-03 | Consultar existencias | La tabla muestra cada producto con su existencia actual (entradas − salidas) y su valor en CRC. El resumen por categoría muestra productos, unidades y valor, con una fila de total. Los datos siguen ahí al detener y volver a arrancar el servidor. |
| RF-04 (opcional) | Consultar producto por código QR | Cada producto tiene un QR imprimible con su código. Al leerlo se abre la ficha del producto con código, nombre, categoría y existencia actual. Un código inexistente muestra "Producto no encontrado". Se decide en T-14. |

## Reglas de negocio

- **RN-01 (central, verificable).** Una salida no puede ser mayor que la existencia actual del producto. La existencia nunca queda negativa.
- **RN-02.** Las cantidades son números enteros mayores que cero.
- **RN-03.** El código de producto es único. Se guarda en mayúsculas y solo admite letras, números y guiones (máximo 20 caracteres).
- **RN-04.** La moneda es el colón costarricense (CRC). El costo unitario no puede ser negativo. El valor de un producto es existencia × costo unitario, y se muestra un resumen por categoría.

## Datos

Archivo `datos/inventario.json`. La primera vez se crea copiando `datos/semilla.json`, que trae 10 productos y 20 movimientos ficticios.

| Entidad | Campos |
| --- | --- |
| Producto | `codigo` (texto único), `nombre`, `categoria`, `costoUnitario` (colones enteros, ≥ 0) |
| Movimiento | `id` (consecutivo), `codigoProducto`, `tipo` (`entrada` o `salida`), `cantidad` (entero > 0), `fecha` (AAAA-MM-DD) |

La existencia y el valor no se guardan: se calculan a partir de los movimientos (ver D-03).

## Arquitectura

```
Navegador (public/index.html + app.js)        → solo muestra y envía datos
        │  fetch JSON
        ▼
Servidor HTTP (src/servidor.js)                → traduce HTTP a llamadas del servicio
        │
        ▼
Servicio de inventario (src/servicio.js)       → TODAS las reglas y cálculos (RN-01 a RN-04)
        │
        ▼
Repositorio JSON (src/repositorio.js)          → lee y escribe datos/inventario.json
```

Las pruebas (`pruebas/`) llaman directamente al servicio y, en P-07, al servidor por HTTP.

| Método | Ruta | Qué hace | Respuestas |
| --- | --- | --- | --- |
| GET | `/api/inventario` | Existencias, categorías, totales y últimos 15 movimientos | 200 |
| POST | `/api/productos` | Registra un producto (RF-01) | 201, o 400 con `{ "error": "…" }` |
| POST | `/api/movimientos` | Registra una entrada o salida (RF-02) | 201, o 400 con `{ "error": "…" }` |

## Decisiones técnicas

| ID | Decisión | Motivo |
| --- | --- | --- |
| D-01 | JavaScript con Node.js 22, sin librerías externas | Ronny ya trabajó con JavaScript; un solo lenguaje en el servidor y en la página; nada que instalar con `npm install`. |
| D-02 | Persistencia en archivo JSON (elegido por Ronny) | Es simple, legible y se puede abrir para mostrarlo en la demo. |
| D-03 | La existencia se calcula siempre desde los movimientos | Evita que el número guardado y el historial se descuadren; hace verificable el indicador de exactitud. |
| D-04 | Las validaciones se hacen solo en el servicio | Una sola fuente de verdad: la página, la API y las pruebas reciben el mismo mensaje. |
| D-05 | Costo en colones enteros | En CRC no se usan céntimos en precios de muebles; evita errores de redondeo. |
| D-06 | Guardado atómico (archivo temporal y luego renombrar) | Si algo falla a mitad del guardado, el archivo anterior queda intacto. |
| D-07 | Pruebas con el ejecutor integrado `node --test` | Cumple "una prueba automatizada con su comando" sin dependencias. |
