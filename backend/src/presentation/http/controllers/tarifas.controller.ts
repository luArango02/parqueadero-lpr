import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';

import { TarifasService } from '../../../application/tarifas/tarifas.service';

interface CrearVersionTarifaBody {
  sedeId: string;
  tipoVehiculo: 'CARRO' | 'MOTO';
  valorDiurno: number;
  valorNocturno: number;
}

@Controller('tarifas')
export class TarifasController {
  constructor(private readonly tarifasService: TarifasService) {}

  @Get()
  listar(@Query('sedeId', new ParseUUIDPipe()) sedeId: string) {
    return this.tarifasService.listar(sedeId);
  }

  @Get('vigentes')
  listarVigentes(
    @Query('sedeId', new ParseUUIDPipe()) sedeId: string,
    @Query('fecha') fecha?: string,
  ) {
    if (!fecha) {
      return this.tarifasService.listarVigentes(sedeId);
    }

    const fechaConsultada = new Date(fecha);

    if (
      !Number.isFinite(fechaConsultada.getTime()) ||
      !/^\d{4}-\d{2}-\d{2}T/.test(fecha)
    ) {
      throw new BadRequestException(
        'La fecha debe ser válida y estar en formato ISO 8601.',
      );
    }

    return this.tarifasService.listarVigentes(sedeId, fechaConsultada);
  }

  @Post('versiones')
  crearVersion(@Body() body: CrearVersionTarifaBody) {
    if (
      !body ||
      typeof body.sedeId !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        body.sedeId,
      )
    ) {
      throw new BadRequestException(
        'El ID de la sede debe ser un UUID válido.',
      );
    }

    if (body.tipoVehiculo !== 'CARRO' && body.tipoVehiculo !== 'MOTO') {
      throw new BadRequestException(
        'El tipo de vehículo debe ser CARRO o MOTO.',
      );
    }

    if (
      typeof body.valorDiurno !== 'number' ||
      typeof body.valorNocturno !== 'number'
    ) {
      throw new BadRequestException(
        'Los valores de las tarifas deben ser números.',
      );
    }

    return this.tarifasService.actualizarTarifas(body);
  }

  @Get(':id')
  buscarPorId(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.tarifasService.buscarPorId(id);
  }
}
