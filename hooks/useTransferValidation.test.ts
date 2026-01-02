import { describe, it, expect } from "vitest";
import {
  validateTransfer,
  TransferValidationContext,
} from "./useTransferValidation";
import { TransferState } from "./useTransferReducer";

describe("validateTransfer", () => {
  const defaultContext: TransferValidationContext = {
    fromAccountBalance: 1000,
  };

  describe("fromIndex validation", () => {
    it("should return error when fromIndex is null", () => {
      const state: TransferState = {
        fromIndex: null,
        toIndex: 1,
        amount: "100",
      };

      const errors = validateTransfer(state, defaultContext);

      expect(errors.fromIndex).toBe("Please select an account");
    });

    it("should not return error when fromIndex is set", () => {
      const state: TransferState = {
        fromIndex: 0,
        toIndex: 1,
        amount: "100",
      };

      const errors = validateTransfer(state, defaultContext);

      expect(errors.fromIndex).toBeUndefined();
    });
  });

  describe("toIndex validation", () => {
    it("should return error when toIndex is null", () => {
      const state: TransferState = {
        fromIndex: 0,
        toIndex: null,
        amount: "100",
      };

      const errors = validateTransfer(state, defaultContext);

      expect(errors.toIndex).toBe("Please select an account");
    });

    it("should not return error when toIndex is set", () => {
      const state: TransferState = {
        fromIndex: 0,
        toIndex: 1,
        amount: "100",
      };

      const errors = validateTransfer(state, defaultContext);

      expect(errors.toIndex).toBeUndefined();
    });
  });

  describe("same account validation", () => {
    it("should return error when fromIndex equals toIndex", () => {
      const state: TransferState = {
        fromIndex: 1,
        toIndex: 1,
        amount: "100",
      };

      const errors = validateTransfer(state, defaultContext);

      expect(errors.toIndex).toBe("From and To accounts must be different");
    });

    it("should not return error when accounts are different", () => {
      const state: TransferState = {
        fromIndex: 0,
        toIndex: 1,
        amount: "100",
      };

      const errors = validateTransfer(state, defaultContext);

      expect(errors.toIndex).toBeUndefined();
    });
  });

  describe("amount validation", () => {
    it("should return error when amount is empty", () => {
      const state: TransferState = {
        fromIndex: 0,
        toIndex: 1,
        amount: "",
      };

      const errors = validateTransfer(state, defaultContext);

      expect(errors.amount).toBe("Please enter an amount");
    });

    it("should return error when amount is not a valid number", () => {
      const state: TransferState = {
        fromIndex: 0,
        toIndex: 1,
        amount: "abc",
      };

      const errors = validateTransfer(state, defaultContext);

      expect(errors.amount).toBe("Please enter a valid amount");
    });

    it("should return error when amount is zero", () => {
      const state: TransferState = {
        fromIndex: 0,
        toIndex: 1,
        amount: "0",
      };

      const errors = validateTransfer(state, defaultContext);

      expect(errors.amount).toBe("Amount must be greater than 0");
    });

    it("should return error when amount is negative", () => {
      const state: TransferState = {
        fromIndex: 0,
        toIndex: 1,
        amount: "-10",
      };

      const errors = validateTransfer(state, defaultContext);

      expect(errors.amount).toBe("Amount must be greater than 0");
    });

    it("should not return error for valid amount", () => {
      const state: TransferState = {
        fromIndex: 0,
        toIndex: 1,
        amount: "100",
      };

      const errors = validateTransfer(state, defaultContext);

      expect(errors.amount).toBeUndefined();
    });

    it("should allow amounts with up to 2 decimal places", () => {
      const state: TransferState = {
        fromIndex: 0,
        toIndex: 1,
        amount: "100.99",
      };

      const errors = validateTransfer(state, defaultContext);

      expect(errors.amount).toBeUndefined();
    });
  });

  describe("insufficient funds validation", () => {
    it("should return error when amount exceeds balance", () => {
      const state: TransferState = {
        fromIndex: 0,
        toIndex: 1,
        amount: "1500",
      };
      const context: TransferValidationContext = {
        fromAccountBalance: 1000,
      };

      const errors = validateTransfer(state, context);

      expect(errors.amount).toBe("Insufficient funds");
    });

    it("should not return error when amount equals balance", () => {
      const state: TransferState = {
        fromIndex: 0,
        toIndex: 1,
        amount: "1000",
      };
      const context: TransferValidationContext = {
        fromAccountBalance: 1000,
      };

      const errors = validateTransfer(state, context);

      expect(errors.amount).toBeUndefined();
    });

    it("should not return error when amount is less than balance", () => {
      const state: TransferState = {
        fromIndex: 0,
        toIndex: 1,
        amount: "500",
      };
      const context: TransferValidationContext = {
        fromAccountBalance: 1000,
      };

      const errors = validateTransfer(state, context);

      expect(errors.amount).toBeUndefined();
    });

    it("should skip balance check when fromAccountBalance is null", () => {
      const state: TransferState = {
        fromIndex: 0,
        toIndex: 1,
        amount: "1500",
      };
      const context: TransferValidationContext = {
        fromAccountBalance: null,
      };

      const errors = validateTransfer(state, context);

      expect(errors.amount).toBeUndefined();
    });
  });

  describe("valid transfer", () => {
    it("should return no errors for valid transfer", () => {
      const state: TransferState = {
        fromIndex: 0,
        toIndex: 1,
        amount: "100.50",
      };
      const context: TransferValidationContext = {
        fromAccountBalance: 1000,
      };

      const errors = validateTransfer(state, context);

      expect(errors).toEqual({});
    });
  });

  describe("multiple errors", () => {
    it("should return multiple errors when multiple validations fail", () => {
      const state: TransferState = {
        fromIndex: null,
        toIndex: null,
        amount: "",
      };
      const context: TransferValidationContext = {
        fromAccountBalance: null,
      };

      const errors = validateTransfer(state, context);

      expect(errors.fromIndex).toBe("Please select an account");
      expect(errors.toIndex).toBe("Please select an account");
      expect(errors.amount).toBe("Please enter an amount");
    });
  });
});
