# Plan: Inventario Hogar

Entrega: 24 de noviembre de 2026. Ruta crítica: T-01 → T-03 → T-04 → T-05 → T-06 → T-07 → T-08 → T-13.

## Tareas

| Tarea | Descripción | Depende de | Requisito | Prueba | Estado |
| --- | --- | --- | --- | --- | --- |
| T-01 | Decidir tecnología, persistencia e interfaz (Node.js, JSON, web) | — | — | — | Hecho |
| T-02 | Redactar intent.md, spec.md y plan.md | T-01 | Todos | — | Hecho |
| T-03 | Crear repositorio con README y estructura de carpetas | T-01 | — | — | Hecho (falta subir a GitHub) |
| T-04 | Modelo de datos y repositorio JSON | T-03 | RF-03 | P-06, P-06b | Hecho |
| T-05 | Servicio: registrar producto con validaciones | T-04 | RF-01, RN-03, RN-04 | P-01, P-02 | Hecho |
| T-06 | Servicio: registrar movimiento aplicando RN-01 y RN-02 | T-05 | RF-02 | P-03, P-04, P-04b | Hecho |
| T-07 | Servicio: existencias, valor y resumen por categoría | T-06 | RF-03, RN-04 | P-05, P-10, P-10b | Hecho |
| T-08 | Servidor HTTP e interfaz web que conectan las tres funciones | T-07 | RF-01 a RF-03 | P-07a, P-07b, P-07 | Hecho |
| T-09 | Datos ficticios iniciales (10 productos, 20 movimientos) | T-04 | RF-03 | P-05 | Hecho |
| T-10 | Un solo comando para todas las pruebas (`npm test`) | T-05, T-06, T-07 | Todos | P-01 a P-10b | Hecho |
| T-11 | docs/uso-ia.md con los ciclos de trabajo con IA y su revisión humana | Todo el proyecto | — | — | En curso (Ronny completa la revisión) |
| T-12 | docs/negocio.md: beneficio, costos, limitaciones, adopción | T-02 | — | — | Hecho (borrador para revisión de Ronny) |
| T-13 | docs/demo.md: guion de 12 minutos con caso de error, y ensayo cronometrado | T-08, T-09 | Todos | P-07 | Guion hecho; ensayo pendiente |
| T-14 | Medir el tiempo restante y decidir si se construye RF-04 | T-08, T-10 | RF-04 | — | Pendiente |
| T-15 | Generar el QR de cada producto y la ficha que abre al leerlo | T-14 (si se aprueba) | RF-04 | P-08, P-09 | Pendiente |
| T-16 | Subir el repositorio a GitHub | T-03 | — | — | Pendiente (Ronny crea el repositorio vacío) |

## Trazabilidad requisito → tarea → prueba

| Requisito | Tareas | Pruebas automáticas | Prueba manual |
| --- | --- | --- | --- |
| RF-01 Registrar producto | T-05, T-08 | P-01, P-02, P-07a | P-07 |
| RF-02 Registrar entrada o salida | T-06, T-08 | P-03, P-04, P-04b, P-07a | P-07 |
| RF-03 Consultar existencias | T-04, T-07, T-08, T-09 | P-05, P-06, P-06b, P-07a | P-07 |
| RF-04 QR (opcional) | T-14, T-15 | P-08 | P-09 |
| RN-01 Sin existencias negativas | T-06 | P-04, P-04b, P-07a | P-07 |
| RN-02 Cantidad entera > 0 | T-06 | P-04 | — |
| RN-03 Código único | T-05 | P-02 | — |
| RN-04 CRC, valor y resumen por categoría | T-05, T-07 | P-02, P-10, P-10b | P-07 |

## Pruebas

Comando: `npm test` (equivale a `node --test`). Resultado al 22 de noviembre de 2026: 12 de 12 pasan.

| Prueba | Tipo | Caso | Resultado esperado |
| --- | --- | --- | --- |
| P-01 | Automática | Registrar producto válido | Queda en el catálogo con existencia 0 |
| P-02 | Automática | Código repetido, nombre o categoría vacíos, costo negativo o no numérico | Se rechaza con mensaje; el catálogo no cambia |
| P-03 | Automática | Entrada de 10 y salida de 4 | Existencia 6 |
| P-04 | Automática | Salida de 7 con existencia 6; cantidades 0, −3, "abc", 2.5, vacía; producto o tipo inexistente; fecha inválida | Se rechaza; la existencia sigue en 6 |
| P-04b | Automática | 5 salidas excesivas sobre los datos ficticios | 5 de 5 rechazadas, ninguna existencia negativa |
| P-05 | Automática | 20 movimientos ficticios | Existencias iguales al cálculo manual |
| P-06 | Automática | Guardar, crear un servicio nuevo y volver a leer | Datos iguales |
| P-06b | Automática | Primer arranque sin archivo de datos | Se copian los 10 productos de la semilla |
| P-07a | Automática | Flujo completo por HTTP, incluido el error de salida excesiva | Códigos 201 y 400, existencia 3, valor ₡900 000 |
| P-07b | Automática | JSON mal formado enviado a la API | 400 con mensaje claro |
| P-10 | Automática | 6 camas a ₡150 000 y 4 sillas a ₡25 000 | Camas ₡900 000, Muebles ₡100 000, total ₡1 000 000 |
| P-10b | Automática | Resumen de los datos ficticios | Total 77 unidades y ₡5 815 900 |
| P-07 | Manual (demo) | Recorrido en el navegador con caso de error | Ver docs/demo.md |
| P-08 | Automática (RF-04) | Ficha por código existente e inexistente | Pendiente; solo si se construye RF-04 |
| P-09 | Manual (RF-04) | Leer el QR impreso | Pendiente; solo si se construye RF-04 |
