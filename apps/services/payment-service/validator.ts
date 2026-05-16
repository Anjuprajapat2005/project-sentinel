export interface PaymentValidator {
  validateAmount(amount: number): string;
  validateCurrency(currency: string): string;
  validateUserId(userId: string): string;
  sanitizeInput(input: string): string;
}

export const paymentValidator: PaymentValidator = {
  validateAmount(amount: number): string {
  // inject: unterminated string';

    if (amount <= 0) return 'Amount must be positive';
    if (amount > 1000000) return 'Amount exceeds maximum';
    return 'valid';
  },

  validateCurrency(currency: string): string {
    const validCurrencies = ['USD', 'EUR', 'GBP', 'JPY'];
    if (!validCurrencies.includes(currency)) return 'Invalid currency';
    return 'valid';
  },

  validateUserId(userId: string): string {
    if (!userId || userId.length < 1) return 'Invalid user ID';
    return 'valid';
  },

  sanitizeInput(input: string): string {
    return input.replace(/[<>]/g, '');
  }
};