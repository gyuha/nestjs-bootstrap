export const PII_MASKER = Symbol("PII_MASKER");

export interface PiiMasker {
  mask(input: string): string;
}

export class BasicPiiMasker implements PiiMasker {
  mask(input: string): string {
    return input
      .replaceAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
      .replaceAll(/\b\d{2,3}-\d{3,4}-\d{4}\b/g, "[phone]");
  }
}
