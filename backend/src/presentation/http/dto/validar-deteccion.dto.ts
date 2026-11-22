import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ValidarDeteccionDto {
  @ApiProperty({
    example: 'ABC124',
    description:
      'Placa validada o digitada por el operador; se normaliza a mayúsculas y sin espacios',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  placa!: string;

  @ApiProperty({
    example: 'La cámara confundió el 3 con el 4',
    description: 'Motivo de la validación; queda en la trazabilidad',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(5)
  @MaxLength(255)
  motivo!: string;
}
