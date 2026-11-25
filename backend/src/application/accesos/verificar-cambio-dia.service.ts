import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RELOJ, type Reloj } from '../../domain/tiempo/reloj';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import {
  SALIDA_REPOSITORIO,
  type SalidaRepositorio,
} from './salida.repositorio';

@Injectable()
export class VerificarCambioDiaService implements OnApplicationBootstrap {
  private readonly logger = new Logger(VerificarCambioDiaService.name);
  private ejecutando = false;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(SALIDA_REPOSITORIO)
    private readonly salidaRepositorio: SalidaRepositorio,
    @Inject(RELOJ)
    private readonly reloj: Reloj,
  ) {}

  onApplicationBootstrap(): void {
    // Recupera cobros pendientes después de reiniciar el backend.
    void this.verificarCambioDeDia();
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async verificarCambioDeDia(): Promise<void> {
    // Evita ejecuciones simultáneas dentro de esta instancia.
    if (this.ejecutando) {
      return;
    }

    this.ejecutando = true;

    const ahora = this.reloj.ahora();
    let verificadas = 0;
    let errores = 0;

    try {
      const permanencias = await this.prisma.permanencia.findMany({
        where: {
          vehiculoActivoId: { not: null },
          salidaEn: null,
        },
        include: {
          vehiculo: true,
          espacio: {
            include: {
              sede: true,
            },
          },
        },
      });

      for (const permanencia of permanencias) {
        const sede = permanencia.espacio.sede;

        try {
          await this.salidaRepositorio.garantizarCobrosPorCambioDeDia({
            sedeId: sede.id,
            placa: permanencia.vehiculo.placa,
            vehiculoId: permanencia.vehiculoId,
            tipo: permanencia.vehiculo.tipo,
            ingresoEn: permanencia.ingresoEn,
            verificadoEn: ahora,
            zonaHoraria: sede.zonaHoraria,
            inicioDiaOperativo: sede.inicioDiaOperativo,
            inicioFranjaDiurna: sede.inicioFranjaDiurna,
            inicioFranjaNocturna: sede.inicioFranjaNocturna,
          });

          verificadas++;
        } catch (error) {
          errores++;

          this.logger.error(
            `Error verificando cobros de la permanencia ${permanencia.id}`,
            error instanceof Error ? error.stack : String(error),
          );
        }
      }

      if (verificadas > 0 || errores > 0) {
        this.logger.log(
          `Cambio de día: ${verificadas} permanencias verificadas, ${errores} errores`,
        );
      }
    } catch (error) {
      this.logger.error(
        'Error consultando permanencias activas',
        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      this.ejecutando = false;
    }
  }
}
