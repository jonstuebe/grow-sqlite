import { useMemo } from "react";
import { z } from "zod";

import { TransferState } from "./useTransferReducer";

export interface TransferValidationContext {
  fromAccountBalance: number | null;
}

export const transferSchema = z
  .object({
    fromIndex: z
      .number({ message: "Please select an account" })
      .nullable()
      .refine((val) => val !== null, { message: "Please select an account" }),
    toIndex: z
      .number({ message: "Please select an account" })
      .nullable()
      .refine((val) => val !== null, { message: "Please select an account" }),
    amount: z
      .string()
      .min(1, { message: "Please enter an amount" })
      .refine((val) => !isNaN(parseFloat(val)), {
        message: "Please enter a valid amount",
      })
      .refine((val) => parseFloat(val) > 0, {
        message: "Amount must be greater than 0",
      })
      .refine(
        (val) => {
          const decimalIndex = val.indexOf(".");
          if (decimalIndex === -1) return true;
          return val.length - decimalIndex <= 3; // max 2 decimal places
        },
        { message: "Amount can have at most 2 decimal places" }
      ),
  })
  .refine(
    (data) => {
      if (data.fromIndex === null || data.toIndex === null) return true;
      return data.fromIndex !== data.toIndex;
    },
    {
      message: "From and To accounts must be different",
      path: ["toIndex"],
    }
  );

export function createTransferSchemaWithBalance(
  fromAccountBalance: number | null
) {
  return transferSchema.refine(
    (data) => {
      if (fromAccountBalance === null) return true;
      if (data.amount === "" || isNaN(parseFloat(data.amount))) return true;
      return parseFloat(data.amount) <= fromAccountBalance;
    },
    {
      message: "Insufficient funds",
      path: ["amount"],
    }
  );
}

export interface TransferErrors {
  fromIndex?: string;
  toIndex?: string;
  amount?: string;
}

export function validateTransfer(
  state: TransferState,
  context: TransferValidationContext
): TransferErrors {
  const schema = createTransferSchemaWithBalance(context.fromAccountBalance);
  const result = schema.safeParse(state);

  if (result.success) {
    return {};
  }

  const errors: TransferErrors = {};
  for (const issue of result.error.issues) {
    const path = issue.path[0] as keyof TransferErrors;
    if (path && !errors[path]) {
      errors[path] = issue.message;
    }
  }

  return errors;
}

export function useTransferValidation(
  state: TransferState,
  context: TransferValidationContext
) {
  const errors = useMemo(
    () => validateTransfer(state, context),
    [state, context]
  );

  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  return {
    errors,
    isValid,
  };
}
