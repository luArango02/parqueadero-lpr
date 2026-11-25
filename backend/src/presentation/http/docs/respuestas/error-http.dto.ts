import { ApiProperty } from '@nestjs/swagger';

export class ErrorHttpDto {
  @ApiProperty({
    description: 'Código de estado HTTP',
    example: 400,
    type: Number,
  })
  statusCode!: number;

  @ApiProperty({
    description: 'Mensaje del error o listado de mensajes de validación',
    oneOf: [
      { type: 'string' },
      {
        type: 'array',
        items: { type: 'string' },
      },
    ],
    example: ['email must be an email'],
  })
  message!: string | string[];

  @ApiProperty({
    description: 'Ruta de la solicitud',
    example: '/api/auth/login',
  })
  path!: string;

  @ApiProperty({
    description: 'Fecha y hora del error en UTC',
    type: String,
    format: 'date-time',
    example: '2026-11-25T15:30:00.000Z',
  })
  timestamp!: string;
}
