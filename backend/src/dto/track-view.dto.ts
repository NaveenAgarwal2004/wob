import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TrackViewDto {
  @ApiProperty({ description: 'Session ID for tracking' })
  @IsString()
  sessionId: string;

  @ApiProperty({ description: 'User ID (optional)', required: false })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ 
    description: 'Path information as JSON', 
    example: { path: '/products/123', title: 'Product Name' } 
  })
  @IsObject()
  pathJson: Record<string, any>;
}
