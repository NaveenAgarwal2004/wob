import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ViewHistory } from '../entities/view-history.entity';

@Injectable()
export class ViewHistoryService {
  constructor(
    @InjectRepository(ViewHistory)
    private viewHistoryRepo: Repository<ViewHistory>,
  ) {}

  async trackView(sessionId: string, pathJson: Record<string, any>, userId?: string): Promise<ViewHistory> {
    const viewHistory = this.viewHistoryRepo.create({
      sessionId,
      userId,
      pathJson,
    });
    return this.viewHistoryRepo.save(viewHistory);
  }

  async getHistory(sessionId: string, limit = 50): Promise<ViewHistory[]> {
    return this.viewHistoryRepo.find({
      where: { sessionId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getUserHistory(userId: string, limit = 50): Promise<ViewHistory[]> {
    return this.viewHistoryRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
