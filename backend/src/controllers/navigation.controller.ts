import { Controller, Get, Post, Param, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NavigationService } from '../services/navigation.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@ApiTags('navigations')
@Controller('navigations')
export class NavigationController {
  constructor(
    private navigationService: NavigationService,
    @InjectQueue('scrape-queue') private scrapeQueue: Queue,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all navigation headings' })
  @ApiResponse({ status: 200, description: 'Returns all navigations' })
  async getNavigations() {
    const navigations = await this.navigationService.getAll();
    
    // Trigger scrape if empty or stale
    if (navigations.length === 0) {
      await this.scrapeQueue.add('scrape-navigation', { type: 'navigation' });
    }
    
    return navigations;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get navigation by ID' })
  @ApiResponse({ status: 200, description: 'Returns navigation details' })
  @ApiResponse({ status: 404, description: 'Navigation not found' })
  async getNavigation(@Param('id') id: string) {
    return this.navigationService.getById(id);
  }

  @Post(':id/scrape')
  @ApiOperation({ summary: 'Trigger scrape for navigation categories' })
  @ApiResponse({ status: 202, description: 'Scrape job queued' })
  async scrapeNavigation(@Param('id') id: string) {
    const job = await this.scrapeQueue.add('scrape-category', { type: 'category', id, force: true });
    return {
      message: 'Scrape job queued',
      jobId: job.id,
    };
  }
}
