import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth(): any {
    return {
      status: 'ok',
      message: 'World of Books API is running',
      timestamp: new Date().toISOString(),
    };
  }
}
