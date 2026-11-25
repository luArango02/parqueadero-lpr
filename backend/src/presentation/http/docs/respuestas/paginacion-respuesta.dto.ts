import { ApiProperty } from '@nestjs/swagger';

export class PaginacionRespuestaDto {
  @ApiProperty({
    type: 'integer',
    minimum: 0,
    example: 45,
    description: 'Cantidad total de registros que coinciden con los filtros',
  })
  total!: number;

  @ApiProperty({
    type: 'integer',
    minimum: 1,
    example: 1,
    description: 'Página consultada',
  })
  pagina!: number;

  @ApiProperty({
    type: 'integer',
    minimum: 1,
    maximum: 100,
    example: 20,
    description: 'Cantidad máxima de registros por página',
  })
  limite!: number;

  @ApiProperty({
    type: 'integer',
    minimum: 0,
    example: 3,
    description: 'Cantidad total de páginas del resultado',
  })
  totalPaginas!: number;
}
