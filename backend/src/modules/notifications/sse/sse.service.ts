import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';

export interface SseEvent {
  data: Record<string, unknown>;
  type?: string;
  id?: string;
}

@Injectable()
export class SseService {
  private readonly connections = new Map<string, Subject<SseEvent>>();

  getOrCreateSubject(userId: string): Subject<SseEvent> {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Subject<SseEvent>());
    }
    return this.connections.get(userId)!;
  }

  emit(userId: string, event: SseEvent): void {
    this.connections.get(userId)?.next(event);
  }

  broadcast(event: SseEvent): void {
    this.connections.forEach((subject) => subject.next(event));
  }

  removeConnection(userId: string): void {
    this.connections.get(userId)?.complete();
    this.connections.delete(userId);
  }

  connectionCount(): number {
    return this.connections.size;
  }
}
