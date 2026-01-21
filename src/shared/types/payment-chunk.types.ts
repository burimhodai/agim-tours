import { CurrencyTypes } from './currency.types';

export interface IPaymentChunk {
  amount: number;
  currency: CurrencyTypes;
  payment_date?: Date;
}
