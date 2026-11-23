# Caso de negocio

Borrador para revisión de Ronny. Lo marcado como *supuesto* no viene de datos reales de una tienda.

## Beneficio

- **Existencia confiable al momento.** La existencia se calcula siempre desde las entradas y salidas, así que no se descuadra (indicador: 100% de exactitud en la prueba P-05).
- **Se evita vender lo que no hay.** El sistema rechaza toda salida mayor que la existencia (indicador: 5 de 5 rechazos en P-04b). *Supuesto:* hoy esos errores se descubren tarde, al despachar o en el conteo físico.
- **Valor del inventario en colones y por categoría.** El dueño ve cuánto dinero tiene en bodega y en qué categorías (camas, muebles, cocina…), útil para decidir compras.
- **Historial de movimientos.** Cada entrada y salida queda con fecha, lo que permite explicar cualquier existencia.

## Costos

| Concepto | Costo | Nota |
| --- | --- | --- |
| Software | ₡0 | Node.js es gratuito y el prototipo no usa librerías de pago |
| Equipo | ₡0 adicional | *Supuesto:* la tienda ya tiene una computadora |
| Capacitación | *Supuesto:* 1 hora por usuario | Tres pantallas y mensajes en español |
| Carga inicial del catálogo | *Supuesto:* 2 a 4 horas | Depende de cuántos productos tenga la tienda |
| Mantenimiento | Por definir | Respaldos del archivo `datos/inventario.json` |

## Limitaciones

- Un solo usuario y una sola bodega; no hay inicio de sesión.
- Los datos viven en un archivo JSON en una computadora: hay que respaldarlo. No sirve para muchos usuarios a la vez.
- No corrige ni anula movimientos: un error se compensa con un movimiento contrario.
- No maneja impuestos, precios de venta, proveedores ni facturación.
- No hay alertas de existencia mínima.
- Es un prototipo con datos ficticios; no se ha probado con una tienda real.

## Adopción

1. **Piloto de dos semanas** con una sola categoría (por ejemplo, Camas), en paralelo con el método actual.
2. **Conteo físico inicial** de esa categoría para cargar existencias correctas como entradas.
3. **Comparar** al final del piloto la existencia del sistema contra un conteo físico. La meta es una coincidencia del 100%.
4. **Extender** al resto de categorías si el piloto cumple la meta.
5. **Siguiente versión:** QR en las cajas (RF-04), respaldos automáticos y, si crece el uso, cambiar el archivo JSON por una base de datos sin tocar las reglas (solo cambia `src/repositorio.js`).
