# parqueadero-lpr

MVP de un sistema de parqueadero con reconocimiento de placas (LPR: *License Plate Recognition*).
Proyecto de **Ingeniería de Software II** — Universidad Autónoma de Manizales.

## Equipo

| Integrante | Rol Scrum |
|---|---|
| Sergio Alexander Castro López | Product Owner |
| Luis Felipe González López | Scrum Master |
| Luisa María Arango López | Equipo de desarrollo |

Los tres integrantes desarrollan código. Tablero: Jira (proyecto PARQ).

## Stack

| Parte | Tecnología |
|---|---|
| Backend | NestJS + TypeScript |
| Frontend | Vue 3 + Vite |
| Base de datos | PostgreSQL + Prisma |
| Tiempo real | Socket.IO |
| Pruebas | Jest |
| Ejecución local | Docker Compose |
| Nube (opcional) | Render + Neon |

## Estructura

```
backend/    API NestJS (arquitectura hexagonal)
frontend/   Aplicación Vue 3 (pendiente, ACT-003)
docs/       Documentación del proyecto
```

## Cómo ejecutar el backend (por ahora, sin Docker)

```bash
cd backend
npm install
cp .env.example .env
npm run start:dev
```

Comprobar: abrir http://localhost:3000/health

Docker Compose se agrega en ACT-004.

## Pruebas

```bash
cd backend
npm test          # pruebas unitarias
npm run test:e2e  # pruebas de punta a punta
npm run lint      # revisión de estilo
```

## Variables de entorno

Copie `.env.example` como `.env` y complete los valores. **El archivo `.env` nunca se sube al repositorio.**

| Variable | Descripción |
|---|---|
| `PORT` | Puerto del backend (3000) |
| `TZ_SEDE` | Zona horaria de la sede (`America/Bogota`) |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Credenciales del contenedor de PostgreSQL |
| `DATABASE_URL` | Cadena de conexión que usa Prisma |
| `JWT_SECRET` | Clave para firmar los tokens de sesión |
| `JWT_EXPIRES_IN` | Duración de la sesión (por ejemplo `8h`) |

## Flujo de trabajo (Gitflow)

- `main`: solo versiones liberadas (tags `vX.Y.Z`).
- `develop`: integración. Es la rama por defecto.
- `feature/PARQ-XX-descripcion`: una rama por tarea de Jira; sale de `develop` y vuelve a `develop` por pull request.
- `release/x.y.z`: sale de `develop` y entra a `main` por pull request.
- `hotfix/x.y.z`: solo si aplica; sale de `main` y vuelve a `main` y a `develop`.

Reglas:

- No hay commits directos a `main` ni a `develop`: todo entra por pull request.
- Cada pull request necesita la aprobación de otro integrante.
- Los commits siguen [Conventional Commits](https://www.conventionalcommits.org/es/) e incluyen la clave de Jira.

| Tipo | Uso | Ejemplo |
|---|---|---|
| `feat` | Funcionalidad nueva | `feat(accesos): registra ingreso con anti-passback PARQ-17` |
| `fix` | Corrección | `fix(cobros): corrige franja a las 06:00 PARQ-24` |
| `test` | Pruebas | `test(cobros): escenario 7 del contexto PARQ-40` |
| `docs` | Documentación | `docs: agrega variables de entorno al README PARQ-5` |
| `chore` | Configuración | `chore: configura docker compose PARQ-8` |
| `refactor` | Reorganizar sin cambiar comportamiento | `refactor(tarifas): extrae cálculo de franja PARQ-22` |
