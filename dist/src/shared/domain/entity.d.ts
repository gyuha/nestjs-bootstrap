export declare abstract class Entity<T> {
    protected readonly props: T;
    constructor(props: T);
    get id(): string;
    equals(entity?: Entity<T>): boolean;
}
