import { describe, it, expect } from "vitest";
import {
  transferReducer,
  initialTransferState,
  TransferState,
  TransferAction,
} from "./useTransferReducer";

describe("transferReducer", () => {
  describe("initialTransferState", () => {
    it("should have null for fromIndex and toIndex", () => {
      expect(initialTransferState.fromIndex).toBe(null);
      expect(initialTransferState.toIndex).toBe(null);
      expect(initialTransferState.amount).toBe("");
    });
  });

  describe("SET_FROM_INDEX", () => {
    it("should update fromIndex from null", () => {
      const state = initialTransferState;
      const action: TransferAction = { type: "SET_FROM_INDEX", payload: 2 };

      const result = transferReducer(state, action);

      expect(result.fromIndex).toBe(2);
      expect(result.toIndex).toBe(state.toIndex);
      expect(result.amount).toBe(state.amount);
    });

    it("should update fromIndex from existing value", () => {
      const state: TransferState = { fromIndex: 0, toIndex: 1, amount: "" };
      const action: TransferAction = { type: "SET_FROM_INDEX", payload: 2 };

      const result = transferReducer(state, action);

      expect(result.fromIndex).toBe(2);
    });
  });

  describe("SET_TO_INDEX", () => {
    it("should update toIndex from null", () => {
      const state = initialTransferState;
      const action: TransferAction = { type: "SET_TO_INDEX", payload: 3 };

      const result = transferReducer(state, action);

      expect(result.toIndex).toBe(3);
      expect(result.fromIndex).toBe(state.fromIndex);
      expect(result.amount).toBe(state.amount);
    });

    it("should update toIndex from existing value", () => {
      const state: TransferState = { fromIndex: 0, toIndex: 1, amount: "" };
      const action: TransferAction = { type: "SET_TO_INDEX", payload: 3 };

      const result = transferReducer(state, action);

      expect(result.toIndex).toBe(3);
    });
  });

  describe("SWAP_ACCOUNTS", () => {
    it("should swap fromIndex and toIndex when both are set", () => {
      const state: TransferState = {
        fromIndex: 0,
        toIndex: 2,
        amount: "100",
      };
      const action: TransferAction = { type: "SWAP_ACCOUNTS" };

      const result = transferReducer(state, action);

      expect(result.fromIndex).toBe(2);
      expect(result.toIndex).toBe(0);
      expect(result.amount).toBe("100");
    });

    it("should not swap when fromIndex is null", () => {
      const state: TransferState = {
        fromIndex: null,
        toIndex: 2,
        amount: "100",
      };
      const action: TransferAction = { type: "SWAP_ACCOUNTS" };

      const result = transferReducer(state, action);

      expect(result).toBe(state);
    });

    it("should not swap when toIndex is null", () => {
      const state: TransferState = {
        fromIndex: 0,
        toIndex: null,
        amount: "100",
      };
      const action: TransferAction = { type: "SWAP_ACCOUNTS" };

      const result = transferReducer(state, action);

      expect(result).toBe(state);
    });

    it("should not swap when both indices are null", () => {
      const state = initialTransferState;
      const action: TransferAction = { type: "SWAP_ACCOUNTS" };

      const result = transferReducer(state, action);

      expect(result).toBe(state);
    });
  });

  describe("KEY_PRESS", () => {
    describe("numeric keys", () => {
      it("should append digit to empty amount", () => {
        const state = initialTransferState;
        const action: TransferAction = { type: "KEY_PRESS", payload: "5" };

        const result = transferReducer(state, action);

        expect(result.amount).toBe("5");
      });

      it("should append digit to existing amount", () => {
        const state: TransferState = { ...initialTransferState, amount: "12" };
        const action: TransferAction = { type: "KEY_PRESS", payload: "3" };

        const result = transferReducer(state, action);

        expect(result.amount).toBe("123");
      });

      it("should replace leading zero with digit", () => {
        const state: TransferState = { ...initialTransferState, amount: "0" };
        const action: TransferAction = { type: "KEY_PRESS", payload: "5" };

        const result = transferReducer(state, action);

        expect(result.amount).toBe("5");
      });
    });

    describe("decimal point", () => {
      it("should add leading zero when starting with decimal", () => {
        const state = initialTransferState;
        const action: TransferAction = { type: "KEY_PRESS", payload: "." };

        const result = transferReducer(state, action);

        expect(result.amount).toBe("0.");
      });

      it("should append decimal to existing amount", () => {
        const state: TransferState = { ...initialTransferState, amount: "12" };
        const action: TransferAction = { type: "KEY_PRESS", payload: "." };

        const result = transferReducer(state, action);

        expect(result.amount).toBe("12.");
      });

      it("should not allow multiple decimal points", () => {
        const state: TransferState = {
          ...initialTransferState,
          amount: "12.34",
        };
        const action: TransferAction = { type: "KEY_PRESS", payload: "." };

        const result = transferReducer(state, action);

        expect(result.amount).toBe("12.34");
      });
    });

    describe("decimal places limit", () => {
      it("should allow up to 2 decimal places", () => {
        const state: TransferState = {
          ...initialTransferState,
          amount: "12.3",
        };
        const action: TransferAction = { type: "KEY_PRESS", payload: "4" };

        const result = transferReducer(state, action);

        expect(result.amount).toBe("12.34");
      });

      it("should not allow more than 2 decimal places", () => {
        const state: TransferState = {
          ...initialTransferState,
          amount: "12.34",
        };
        const action: TransferAction = { type: "KEY_PRESS", payload: "5" };

        const result = transferReducer(state, action);

        expect(result.amount).toBe("12.34");
      });
    });

    describe("backspace", () => {
      it("should remove last character", () => {
        const state: TransferState = {
          ...initialTransferState,
          amount: "123",
        };
        const action: TransferAction = {
          type: "KEY_PRESS",
          payload: "backspace",
        };

        const result = transferReducer(state, action);

        expect(result.amount).toBe("12");
      });

      it("should handle empty amount", () => {
        const state = initialTransferState;
        const action: TransferAction = {
          type: "KEY_PRESS",
          payload: "backspace",
        };

        const result = transferReducer(state, action);

        expect(result.amount).toBe("");
      });

      it("should remove decimal point", () => {
        const state: TransferState = { ...initialTransferState, amount: "12." };
        const action: TransferAction = {
          type: "KEY_PRESS",
          payload: "backspace",
        };

        const result = transferReducer(state, action);

        expect(result.amount).toBe("12");
      });
    });
  });

  describe("unknown action", () => {
    it("should return current state for unknown action", () => {
      const state = initialTransferState;
      // @ts-expect-error - testing unknown action
      const action: TransferAction = { type: "UNKNOWN" };

      const result = transferReducer(state, action);

      expect(result).toBe(state);
    });
  });
});
