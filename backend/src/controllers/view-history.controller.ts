import { Controller, Post, Get, Body, Query, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
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
  async getHistory(
    @Query('sessionId') sessionId: string,
    @Query('userId') userId?: string,
    @Query('limit') limit: number = 50,
  ) {
    if (userId) {
      return this.viewHistoryService.getUserHistory(userId, limit);
    }
    return this.viewHistoryService.getHistory(sessionId, limit);
  }
}
