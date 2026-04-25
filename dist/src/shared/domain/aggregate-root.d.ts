import { Entity } from "./entity";
export declare abstract class AggregateRoot<T> extends Entity<T> {
  private readonly _domainEvents;
  get domainEvents(): ReadonlyArray<DomainEvent>;
  protected addDomainEvent(domainEvent: DomainEvent): void;
  clearDomainEvents(): void;
}
export interface DomainEvent {
  occurredAt: Date;
}
