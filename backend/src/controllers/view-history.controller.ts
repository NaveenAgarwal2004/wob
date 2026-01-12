// backend/src/controllers/view-history.controller.ts - FIX
import { Controller, Post, Get, Body, Query, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ViewHistoryService } from '../services/view-history.service';
import { TrackViewDto } from '../dto/track-view.dto';

@ApiTags('view-history')
@Controller('view-history')
export class ViewHistoryController {
  constructor(private viewHistoryService: ViewHistoryService) {}

  @Post('track')
  @ApiOperation({ summary: 'Track user navigation' })
  @ApiResponse({ status: 201, description: 'View tracked successfully' })
  async trackView(@Body(ValidationPipe) trackViewDto: TrackViewDto) {
    return this.viewHistoryService.trackView(
      trackViewDto.sessionId,
      trackViewDto.pathJson,
      trackViewDto.userId,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get browsing history' })
  @ApiResponse({ status: 200, description: 'Returns browsing history' })
  @ApiQuery({ name: 'sessionId', required: true, type: String })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getHistory(
    @Query('sessionId') sessionId: string,
    @Query('userId') userId?: string,
    @Query('limit') limit?: string | number, // Accept both string and number
  ) {
    // FIX: Convert limit to number properly
    const limitNum = limit ? parseInt(limit.toString(), 10) : 50;
    
    if (userId) {
      return this.viewHistoryService.getUserHistory(userId, limitNum);
    }
    return this.viewHistoryService.getHistory(sessionId, limitNum);
  }
}