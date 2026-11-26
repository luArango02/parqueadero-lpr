import { ApiProperty } from '@nestjs/swagger';

export class HealthRespuestaDto {
  @ApiProperty({
    enum: ['ok'],
    example: 'ok',
  })
  status!: 'ok';

  @ApiProperty({
    example: 'parqueadero-lpr-backend',
  })
  service!: string;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-11-25T13:00:00.000Z',
  })
  timestamp!: string;

  @ApiProperty({
    enum: ['ok'],
    example: 'ok',
  })
  database!: 'ok';
}
