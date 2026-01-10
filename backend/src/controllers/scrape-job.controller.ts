import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScrapeJob, ScrapeJobStatus } from '../entities/scrape-job.entity';

@ApiTags('scrape-jobs')
@Controller('api/scrape-jobs')
export class ScrapeJobController {
  constructor(
    @InjectRepository(ScrapeJob)
    private scrapeJobRepo: Repository<ScrapeJob>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all scrape jobs' })
  @ApiQuery({ name: 'status', required: false, enum: ScrapeJobStatus })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns scrape jobs' })
  async getJobs(
    @Query('status') status?: ScrapeJobStatus,
    @Query('limit') limit: number = 50,
  ) {
    const query = this.scrapeJobRepo.createQueryBuilder('job');
    
    if (status) {
      query.where('job.status = :status', { status });
    }
    
    query.orderBy('job.createdAt', 'DESC').take(limit);
    
    return query.getMany();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get scrape job by ID' })
  @ApiResponse({ status: 200, description: 'Returns scrape job details' })
  async getJob(@Param('id') id: string) {
    return this.scrapeJobRepo.findOne({ where: { id } });
  }
}
