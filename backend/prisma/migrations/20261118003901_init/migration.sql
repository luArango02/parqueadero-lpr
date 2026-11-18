-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMINISTRADOR', 'OPERADOR');

-- CreateEnum
CREATE TYPE "TipoVehiculo" AS ENUM ('CARRO', 'MOTO');

-- CreateEnum
CREATE TYPE "SentidoCarril" AS ENUM ('ENTRADA', 'SALIDA');

-- CreateEnum
CREATE TYPE "EstadoEspacio" AS ENUM ('DISPONIBLE', 'OCUPADO', 'FUERA_DE_SERVICIO');

-- CreateEnum
CREATE TYPE "Franja" AS ENUM ('DIURNA', 'NOCTURNA');

-- CreateEnum
CREATE TYPE "EstadoCobro" AS ENUM ('PENDIENTE', 'PAGADO', 'ANULADO', 'VENCIDO');

-- CreateEnum
CREATE TYPE "MedioPago" AS ENUM ('EFECTIVO', 'TARJETA', 'PSE', 'NEQUI');

-- CreateEnum
CREATE TYPE "EstadoDeteccion" AS ENUM ('ACEPTADA', 'PENDIENTE_REVISION', 'CORREGIDA');

-- CreateEnum
CREATE TYPE "TipoEvento" AS ENUM ('INGRESO', 'SALIDA', 'INGRESO_DENEGADO', 'SALIDA_DENEGADA');

-- CreateEnum
CREATE TYPE "TipoAlerta" AS ENUM ('ANTI_PASSBACK', 'DISCREPANCIA_TIPO', 'BAJA_CONFIANZA', 'FALLA_CAMARA');

-- CreateEnum
CREATE TYPE "EstadoAlerta" AS ENUM ('ABIERTA', 'RESUELTA');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sedes" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "zona_horaria" TEXT NOT NULL DEFAULT 'America/Bogota',
    "inicio_dia_operativo" TEXT NOT NULL DEFAULT '06:00',
    "inicio_franja_diurna" TEXT NOT NULL DEFAULT '06:00',
    "inicio_franja_nocturna" TEXT NOT NULL DEFAULT '18:00',
    "umbral_confianza" DOUBLE PRECISION NOT NULL DEFAULT 0.8,

    CONSTRAINT "sedes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carriles" (
    "id" TEXT NOT NULL,
    "sede_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "sentido" "SentidoCarril" NOT NULL,

    CONSTRAINT "carriles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "espacios" (
    "id" TEXT NOT NULL,
    "sede_id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "zona" TEXT NOT NULL,
    "tipo_compatible" "TipoVehiculo" NOT NULL,
    "estado" "EstadoEspacio" NOT NULL DEFAULT 'DISPONIBLE',

    CONSTRAINT "espacios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehiculos" (
    "id" TEXT NOT NULL,
    "placa" TEXT NOT NULL,
    "tipo" "TipoVehiculo" NOT NULL,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehiculos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detecciones" (
    "id" TEXT NOT NULL,
    "carril_id" TEXT NOT NULL,
    "placa_leida" TEXT NOT NULL,
    "placa_final" TEXT,
    "confianza" DOUBLE PRECISION NOT NULL,
    "tipo_visual" "TipoVehiculo",
    "estado" "EstadoDeteccion" NOT NULL,
    "lectura_manual" BOOLEAN NOT NULL DEFAULT false,
    "corregida_por_id" TEXT,
    "motivo_correccion" TEXT,
    "foto_url" TEXT,
    "ocurrida_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "detecciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eventos_acceso" (
    "id" TEXT NOT NULL,
    "sede_id" TEXT NOT NULL,
    "carril_id" TEXT NOT NULL,
    "placa" TEXT NOT NULL,
    "vehiculo_id" TEXT,
    "tipo" "TipoEvento" NOT NULL,
    "motivo" TEXT,
    "espacio_id" TEXT,
    "deteccion_id" TEXT,
    "ocurrido_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eventos_acceso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permanencias" (
    "id" TEXT NOT NULL,
    "vehiculo_id" TEXT NOT NULL,
    "espacio_id" TEXT NOT NULL,
    "evento_ingreso_id" TEXT NOT NULL,
    "evento_salida_id" TEXT,
    "ingreso_en" TIMESTAMPTZ(3) NOT NULL,
    "salida_en" TIMESTAMPTZ(3),
    "vehiculo_activo_id" TEXT,
    "espacio_activo_id" TEXT,

    CONSTRAINT "permanencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarifas" (
    "id" TEXT NOT NULL,
    "sede_id" TEXT NOT NULL,
    "tipo_vehiculo" "TipoVehiculo" NOT NULL,
    "franja" "Franja" NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "version" INTEGER NOT NULL,
    "vigente_desde" TIMESTAMPTZ(3) NOT NULL,
    "vigente_hasta" TIMESTAMPTZ(3),

    CONSTRAINT "tarifas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cobros" (
    "id" TEXT NOT NULL,
    "sede_id" TEXT NOT NULL,
    "vehiculo_id" TEXT NOT NULL,
    "placa" TEXT NOT NULL,
    "dia_operativo" DATE NOT NULL,
    "franja" "Franja" NOT NULL,
    "tarifa_id" TEXT NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "estado" "EstadoCobro" NOT NULL DEFAULT 'PENDIENTE',
    "generado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cobros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos" (
    "id" TEXT NOT NULL,
    "cobro_id" TEXT NOT NULL,
    "medio" "MedioPago" NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "referencia" TEXT NOT NULL,
    "registrado_por_id" TEXT,
    "pagado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pagos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alertas" (
    "id" TEXT NOT NULL,
    "sede_id" TEXT NOT NULL,
    "tipo" "TipoAlerta" NOT NULL,
    "estado" "EstadoAlerta" NOT NULL DEFAULT 'ABIERTA',
    "placa" TEXT,
    "detalle" TEXT NOT NULL,
    "deteccion_id" TEXT,
    "resuelta_por_id" TEXT,
    "resolucion" TEXT,
    "creada_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resuelta_en" TIMESTAMPTZ(3),

    CONSTRAINT "alertas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT,
    "accion" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidad_id" TEXT,
    "datos_anteriores" JSONB,
    "datos_nuevos" JSONB,
    "ocurrida_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sedes_nombre_key" ON "sedes"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "carriles_sede_id_nombre_key" ON "carriles"("sede_id", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "espacios_sede_id_codigo_key" ON "espacios"("sede_id", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "vehiculos_placa_key" ON "vehiculos"("placa");

-- CreateIndex
CREATE INDEX "detecciones_placa_leida_idx" ON "detecciones"("placa_leida");

-- CreateIndex
CREATE INDEX "eventos_acceso_placa_ocurrido_en_idx" ON "eventos_acceso"("placa", "ocurrido_en");

-- CreateIndex
CREATE UNIQUE INDEX "permanencias_evento_ingreso_id_key" ON "permanencias"("evento_ingreso_id");

-- CreateIndex
CREATE UNIQUE INDEX "permanencias_evento_salida_id_key" ON "permanencias"("evento_salida_id");

-- CreateIndex
CREATE UNIQUE INDEX "permanencias_vehiculo_activo_id_key" ON "permanencias"("vehiculo_activo_id");

-- CreateIndex
CREATE UNIQUE INDEX "permanencias_espacio_activo_id_key" ON "permanencias"("espacio_activo_id");

-- CreateIndex
CREATE UNIQUE INDEX "tarifas_sede_id_tipo_vehiculo_franja_version_key" ON "tarifas"("sede_id", "tipo_vehiculo", "franja", "version");

-- CreateIndex
CREATE UNIQUE INDEX "cobros_placa_sede_id_dia_operativo_key" ON "cobros"("placa", "sede_id", "dia_operativo");

-- CreateIndex
CREATE UNIQUE INDEX "pagos_cobro_id_key" ON "pagos"("cobro_id");

-- CreateIndex
CREATE UNIQUE INDEX "pagos_referencia_key" ON "pagos"("referencia");

-- CreateIndex
CREATE INDEX "alertas_estado_idx" ON "alertas"("estado");

-- CreateIndex
CREATE INDEX "auditoria_entidad_entidad_id_idx" ON "auditoria"("entidad", "entidad_id");

-- AddForeignKey
ALTER TABLE "carriles" ADD CONSTRAINT "carriles_sede_id_fkey" FOREIGN KEY ("sede_id") REFERENCES "sedes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "espacios" ADD CONSTRAINT "espacios_sede_id_fkey" FOREIGN KEY ("sede_id") REFERENCES "sedes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detecciones" ADD CONSTRAINT "detecciones_carril_id_fkey" FOREIGN KEY ("carril_id") REFERENCES "carriles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detecciones" ADD CONSTRAINT "detecciones_corregida_por_id_fkey" FOREIGN KEY ("corregida_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_acceso" ADD CONSTRAINT "eventos_acceso_sede_id_fkey" FOREIGN KEY ("sede_id") REFERENCES "sedes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_acceso" ADD CONSTRAINT "eventos_acceso_carril_id_fkey" FOREIGN KEY ("carril_id") REFERENCES "carriles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_acceso" ADD CONSTRAINT "eventos_acceso_vehiculo_id_fkey" FOREIGN KEY ("vehiculo_id") REFERENCES "vehiculos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_acceso" ADD CONSTRAINT "eventos_acceso_espacio_id_fkey" FOREIGN KEY ("espacio_id") REFERENCES "espacios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos_acceso" ADD CONSTRAINT "eventos_acceso_deteccion_id_fkey" FOREIGN KEY ("deteccion_id") REFERENCES "detecciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permanencias" ADD CONSTRAINT "permanencias_vehiculo_id_fkey" FOREIGN KEY ("vehiculo_id") REFERENCES "vehiculos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permanencias" ADD CONSTRAINT "permanencias_espacio_id_fkey" FOREIGN KEY ("espacio_id") REFERENCES "espacios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permanencias" ADD CONSTRAINT "permanencias_evento_ingreso_id_fkey" FOREIGN KEY ("evento_ingreso_id") REFERENCES "eventos_acceso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permanencias" ADD CONSTRAINT "permanencias_evento_salida_id_fkey" FOREIGN KEY ("evento_salida_id") REFERENCES "eventos_acceso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarifas" ADD CONSTRAINT "tarifas_sede_id_fkey" FOREIGN KEY ("sede_id") REFERENCES "sedes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cobros" ADD CONSTRAINT "cobros_sede_id_fkey" FOREIGN KEY ("sede_id") REFERENCES "sedes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cobros" ADD CONSTRAINT "cobros_vehiculo_id_fkey" FOREIGN KEY ("vehiculo_id") REFERENCES "vehiculos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cobros" ADD CONSTRAINT "cobros_tarifa_id_fkey" FOREIGN KEY ("tarifa_id") REFERENCES "tarifas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_cobro_id_fkey" FOREIGN KEY ("cobro_id") REFERENCES "cobros"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_registrado_por_id_fkey" FOREIGN KEY ("registrado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertas" ADD CONSTRAINT "alertas_sede_id_fkey" FOREIGN KEY ("sede_id") REFERENCES "sedes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertas" ADD CONSTRAINT "alertas_deteccion_id_fkey" FOREIGN KEY ("deteccion_id") REFERENCES "detecciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertas" ADD CONSTRAINT "alertas_resuelta_por_id_fkey" FOREIGN KEY ("resuelta_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria" ADD CONSTRAINT "auditoria_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
