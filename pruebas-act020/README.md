

\# ACT-020 - Cambio automÃ¡tico de dÃ­a operativo



\## Objetivo



Verificar la generaciÃ³n automÃ¡tica de cobros cuando un vehÃ­culo

permanece estacionado despuÃ©s del cambio de dÃ­a operativo

(06:00, zona horaria America/Bogota).



\## Pruebas automatizadas



\- Pruebas de reglas horarias.

\- CÃ¡lculo de dÃ­as operativos transcurridos.

\- Pruebas del servicio programado.

\- IntegraciÃ³n con PostgreSQL.

\- PrevenciÃ³n de cobros duplicados.

\- VerificaciÃ³n de concurrencia.



\## Prueba manual del scheduler



Archivos:



\- preparar-scheduler.sql: crea los datos de prueba.

\- limpiar-scheduler.sql: elimina los datos de prueba.



IMPORTANTE: ejecutar exclusivamente en la base parqueadero\_test.



El script de preparaciÃ³n crea una permanencia activa para

comprobar que el scheduler genera cobros por los dÃ­as

operativos transcurridos.



DespuÃ©s de verificar los resultados, detener el backend

temporal de pruebas y ejecutar limpiar-scheduler.sql.



\## Resultados obtenidos



\- 201 pruebas unitarias y de servicios superadas.

\- 6 pruebas de integraciÃ³n superadas.

\- CompilaciÃ³n NestJS correcta.

\- Scheduler validado en Docker.

\- 4 cobros generados para 4 dÃ­as operativos.

\- 4 auditorÃ­as registradas.

\- Sin duplicados tras ejecuciones periÃ³dicas.

\- Datos temporales eliminados correctamente.
