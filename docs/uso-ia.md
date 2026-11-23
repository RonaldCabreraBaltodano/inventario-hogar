# Uso de IA en el proyecto

Herramienta: Claude Code. Cada ciclo registra qué se le pidió a la IA, qué propuso y qué decidió o corrigió la revisión humana (Ronny).

> Ronny: revisa cada ciclo y completa o corrige la columna de revisión humana con tus propias palabras antes de entregar.

## Ciclo 1: entender la guía y planificar (22 de noviembre de 2026)

- **Pedido:** entender qué exige la guía del proyecto final y proponer un plan sobre inventarios, sin escribir código.
- **Propuesta de la IA:** intent.md, esquemas de spec.md y plan.md, tres requisitos (producto, movimiento, existencias), la regla "una salida no puede dejar la existencia negativa", un indicador de exactitud y siete preguntas abiertas. Marcó como supuesto todo lo que no venía de Ronny.
- **Revisión humana:** Ronny respondió las preguntas. Eligió el negocio (tienda de camas, muebles y menaje), persistencia en archivo JSON, entrega por GitHub el 24 de noviembre, y aprobó el indicador. También pidió aplicar las reglas del proyecto de costo en CRC y resumen por categoría, que la IA había dejado como opcionales.

## Ciclo 2: elegir interfaz y tecnología (22 de noviembre de 2026)

- **Pedido:** explicar la diferencia entre interfaz web, consola y API, y recomendar una tecnología.
- **Propuesta de la IA:** recomendó web porque la demo es sin diapositivas, y JavaScript con Node.js porque Ronny ya usó JavaScript. Explicó qué es Node.js y cómo verificar si estaba instalado.
- **Revisión humana:** Ronny pidió la explicación antes de decidir, verificó en su computadora que tenía Node.js 22.17.0 y confirmó web y Node.js.

## Ciclo 3: idea del código QR (22 de noviembre de 2026)

- **Pedido:** Ronny propuso un código QR para pegar en las cajas que muestre la información del producto.
- **Propuesta de la IA:** la consideró útil, pero advirtió que amplía el alcance y que en una demo en vivo el celular necesita estar en la misma red. Propuso dejarla como RF-04 opcional, después de lo obligatorio.
- **Revisión humana:** Ronny decidió agregarla como RF-04 y medir después si conviene construirla por tiempo (tarea T-14).

## Ciclo 4: construcción del prototipo (22 de noviembre de 2026)

- **Pedido:** construir el prototipo según el plan aprobado.
- **Propuesta de la IA:** servicio con reglas separado de la pantalla, repositorio JSON, servidor HTTP, página web, datos ficticios y 12 pruebas automatizadas (`npm test`, todas pasan). Tomó decisiones técnicas documentadas en spec.md (D-03: calcular la existencia desde los movimientos; D-05: costo en colones enteros).
- **Revisión humana:** *pendiente.* Ronny debe correr `npm start` y `npm test` en su computadora, probar el caso de error y anotar aquí qué cambió o aprobó.
