import { AggregateRoot } from '../../../../shared/domain/aggregate-root';
export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}
export interface AIRequestProps {
    id: string;
    messages: ChatMessage[];
    model?: string;
    temperature?: number;
    maxTokens?: number;
    sessionId?: string;
    userId?: string;
}
export declare class AIRequest extends AggregateRoot<AIRequestProps> {
    get id(): string;
    get messages(): ChatMessage[];
    get model(): string;
    get temperature(): number;
    get maxTokens(): number;
    get sessionId(): string | undefined;
    get userId(): string | undefined;
}
