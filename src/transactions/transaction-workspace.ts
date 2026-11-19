import { AsyncLocalStorage } from 'node:async_hooks';
import { BadRequestException } from '@nestjs/common';

export const transactionWorkspace = new AsyncLocalStorage<{
  agency: string;
  user: string;
}>();

export function requireTransactionWorkspace() {
  const workspace = transactionWorkspace.getStore();
  if (!workspace) {
    throw new BadRequestException('Zgjidhni agjencinë në hapësirën e punës.');
  }
  return workspace;
}
