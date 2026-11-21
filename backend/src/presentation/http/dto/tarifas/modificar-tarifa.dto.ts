import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Max, Min } from 'class-validator';

export class ModificarTarifaDto {
  @ApiProperty({
    description:
      'Nuevo valor de la tarifa. La modificacion crea una nueva version sin alterar el historial.',
    example: 10000,
    minimum: 0,
    maximum: 9999999999.99,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(9999999999.99)
  valor!: number;
}
