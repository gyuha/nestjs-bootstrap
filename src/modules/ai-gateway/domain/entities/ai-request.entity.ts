import { AggregateRoot } from "../../../../shared/domain/aggregate-root";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
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

export class AIRequest extends AggregateRoot<AIRequestProps> {
  get id(): string {
    return this.props.id;
  }

  get messages(): ChatMessage[] {
    return this.props.messages;
  }

  get model(): string {
    return this.props.model ?? "gpt-4o";
  }

  get temperature(): number {
    return this.props.temperature ?? 0.7;
  }

  get maxTokens(): number {
    return this.props.maxTokens ?? 2048;
  }

  get sessionId(): string | undefined {
    return this.props.sessionId;
  }

  get userId(): string | undefined {
    return this.props.userId;
  }
}
