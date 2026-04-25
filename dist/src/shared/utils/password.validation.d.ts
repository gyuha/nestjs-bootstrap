export interface PasswordValidationResult {
    isValid: boolean;
    errors: string[];
}
export declare function validatePassword(password: string): PasswordValidationResult;
