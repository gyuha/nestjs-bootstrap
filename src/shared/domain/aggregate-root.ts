import { Entity } from "./entity";

export abstract class AggregateRoot<T> extends Entity<T> {
  private readonly _domainEvents: DomainEvent[] = [];

  get domainEvents(): ReadonlyArray<DomainEvent> {
    return [...this._domainEvents];
  }

  protected addDomainEvent(domainEvent: DomainEvent): void {
    this._domainEvents.push(domainEvent);
  }

  clearDomainEvents(): void {
    this._domainEvents.splice(0, this._domainEvents.length);
  }
}

export interface DomainEvent {
  occurredAt: Date;
}
