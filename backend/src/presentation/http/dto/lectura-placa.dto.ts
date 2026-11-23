import {
  ApiHideProperty,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

// Lo que envía el carril (entrada o salida) cuando la cámara lee una placa.
export class LecturaPlacaDto {
  @ApiProperty({
    example: 'ABC123',
    description: 'Placa leída por la cámara o el simulador',
  })
  @IsString()
  @IsNotEmpty()
  placa!: string;

  @ApiPropertyOptional({
    example: 0.95,
    description: 'Confianza de la lectura, de 0 a 1',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confianza?: number;

  // Oculto en Swagger: el ejemplo autogenerado ("string") no es un UUID y la petición fallaba.
  // Si se omite se usa el primer carril de la sede.
  @ApiHideProperty()
  @IsOptional()
  @IsUUID()
  carrilId?: string;
}
