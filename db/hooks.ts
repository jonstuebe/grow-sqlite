import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { useSQLiteContext } from "./provider";
import {
  getAccounts,
  getAccount,
  getTotalBalance,
  createAccount,
  updateAccount,
  deleteAccount,
  archiveAccount,
  getTransactions,
  getTransaction,
  createTransaction,
  deleteTransaction,
} from "./queries";
import type {
  Account,
  Transaction,
  CreateAccountInput,
  UpdateAccountInput,
  CreateTransactionInput,
} from "./types";

// ============================================================================
// Query Keys
// ============================================================================

export const queryKeys = {
  accounts: ["accounts"] as const,
  account: (id: string) => ["accounts", id] as const,
  totalBalance: ["totalBalance"] as const,
  transactions: (accountId?: string) =>
    accountId ? (["transactions", accountId] as const) : (["transactions"] as const),
  transaction: (id: string) => ["transactions", "detail", id] as const,
};

// ============================================================================
// Account Hooks
// ============================================================================

/**
 * Fetch all accounts with their current balances
 */
export function useAccounts() {
  const db = useSQLiteContext();

  return useQuery({
    queryKey: queryKeys.accounts,
    queryFn: () => getAccounts(db),
  });
}

/**
 * Fetch a single account by ID
 */
export function useAccount(id: string) {
  const db = useSQLiteContext();

  return useQuery({
    queryKey: queryKeys.account(id),
    queryFn: () => getAccount(db, id),
    enabled: !!id,
  });
}

/**
 * Get total balance across all accounts
 */
export function useTotalBalance() {
  const db = useSQLiteContext();

  return useQuery({
    queryKey: queryKeys.totalBalance,
    queryFn: () => getTotalBalance(db),
  });
}

/**
 * Create a new account
 */
export function useCreateAccount() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAccountInput) => createAccount(db, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
    },
  });
}

/**
 * Update an existing account
 */
export function useUpdateAccount() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateAccountInput & { id: string }) =>
      updateAccount(db, id, input),
    onSuccess: (account) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
      queryClient.invalidateQueries({ queryKey: queryKeys.account(account.id) });
    },
  });
}

/**
 * Delete an account
 */
export function useDeleteAccount() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAccount(db, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
      queryClient.invalidateQueries({ queryKey: queryKeys.totalBalance });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

/**
 * Archive an account (soft delete)
 */
export function useArchiveAccount() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => archiveAccount(db, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
      queryClient.invalidateQueries({ queryKey: queryKeys.totalBalance });
    },
  });
}

// ============================================================================
// Transaction Hooks
// ============================================================================

/**
 * Fetch transactions, optionally filtered by account
 */
export function useTransactions(accountId?: string) {
  const db = useSQLiteContext();

  return useQuery({
    queryKey: queryKeys.transactions(accountId),
    queryFn: () => getTransactions(db, accountId),
  });
}

/**
 * Fetch a single transaction by ID
 */
export function useTransaction(id: string) {
  const db = useSQLiteContext();

  return useQuery({
    queryKey: queryKeys.transaction(id),
    queryFn: () => getTransaction(db, id),
    enabled: !!id,
  });
}

/**
 * Create a new transaction
 * Automatically invalidates related account and balance queries
 */
export function useCreateTransaction() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTransactionInput) => createTransaction(db, input),
    onSuccess: (transaction) => {
      // Invalidate all transaction queries
      queryClient.invalidateQueries({ queryKey: ["transactions"] });

      // Invalidate the affected account(s)
      queryClient.invalidateQueries({
        queryKey: queryKeys.account(transaction.account_id),
      });
      if (transaction.related_account_id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.account(transaction.related_account_id),
        });
      }

      // Invalidate accounts list and total balance
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
      queryClient.invalidateQueries({ queryKey: queryKeys.totalBalance });
    },
  });
}

/**
 * Delete a transaction
 * Automatically invalidates related account and balance queries
 */
export function useDeleteTransaction() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Get transaction first to know which accounts to invalidate
      const transaction = await getTransaction(db, id);
      await deleteTransaction(db, id);
      return transaction;
    },
    onSuccess: (transaction) => {
      // Invalidate all transaction queries
      queryClient.invalidateQueries({ queryKey: ["transactions"] });

      // Invalidate affected accounts if we had transaction data
      if (transaction) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.account(transaction.account_id),
        });
        if (transaction.related_account_id) {
          queryClient.invalidateQueries({
            queryKey: queryKeys.account(transaction.related_account_id),
          });
        }
      }

      // Invalidate accounts list and total balance
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
      queryClient.invalidateQueries({ queryKey: queryKeys.totalBalance });
    },
  });
}
