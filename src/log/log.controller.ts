import { Controller, Sse, MessageEvent, UseGuards } from '@nestjs/common';
import { Observable, merge, map, from } from 'rxjs';
import { LogService } from './log.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('logs')
// @UseGuards(JwtAuthGuard)
export class LogController {
  @Sse('stream')
  streamLogs(): Observable<MessageEvent> {
    const history = LogService.getHistory();
    const historySource = from(history).pipe(
      map((log) => ({ data: log }) as MessageEvent),
    );

    const liveSource = LogService.log$.pipe(
      map((log) => ({ data: log }) as MessageEvent),
    );

    return merge(historySource, liveSource);
  }
}
