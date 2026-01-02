import { describe, it, expect } from "vitest";
import {
  withdrawalReducer,
  initialWithdrawalState,
  WithdrawalState,
  WithdrawalAction,
} from "./useWithdrawalReducer";

describe("withdrawalReducer", () => {
  describe("initialWithdrawalState", () => {
    it("should have empty amount", () => {
      expect(initialWithdrawalState.amount).toBe("");
    });
  });

  describe("KEY_PRESS", () => {
    describe("numeric keys", () => {
      it("should append digit to empty amount", () => {
        const state = initialWithdrawalState;
        const action: WithdrawalAction = { type: "KEY_PRESS", payload: "5" };

        const result = withdrawalReducer(state, action);

        expect(result.amount).toBe("5");
      });

      it("should append digit to existing amount", () => {
        const state: WithdrawalState = {
          ...initialWithdrawalState,
          amount: "12",
        };
        const action: WithdrawalAction = { type: "KEY_PRESS", payload: "3" };

        const result = withdrawalReducer(state, action);

        expect(result.amount).toBe("123");
      });

      it("should replace leading zero with digit", () => {
        const state: WithdrawalState = {
          ...initialWithdrawalState,
          amount: "0",
        };
        const action: WithdrawalAction = { type: "KEY_PRESS", payload: "5" };

        const result = withdrawalReducer(state, action);

        expect(result.amount).toBe("5");
      });
    });

    describe("decimal point", () => {
      it("should add leading zero when starting with decimal", () => {
        const state = initialWithdrawalState;
        const action: WithdrawalAction = { type: "KEY_PRESS", payload: "." };

        const result = withdrawalReducer(state, action);

        expect(result.amount).toBe("0.");
      });

      it("should append decimal to existing amount", () => {
        const state: WithdrawalState = {
          ...initialWithdrawalState,
          amount: "12",
        };
        const action: WithdrawalAction = { type: "KEY_PRESS", payload: "." };

        const result = withdrawalReducer(state, action);

        expect(result.amount).toBe("12.");
      });

      it("should not allow multiple decimal points", () => {
        const state: WithdrawalState = {
          ...initialWithdrawalState,
          amount: "12.34",
        };
        const action: WithdrawalAction = { type: "KEY_PRESS", payload: "." };

        const result = withdrawalReducer(state, action);

        expect(result.amount).toBe("12.34");
      });
    });

    describe("decimal places limit", () => {
      it("should allow up to 2 decimal places", () => {
        const state: WithdrawalState = {
          ...initialWithdrawalState,
          amount: "12.3",
        };
        const action: WithdrawalAction = { type: "KEY_PRESS", payload: "4" };

        const result = withdrawalReducer(state, action);

        expect(result.amount).toBe("12.34");
      });

      it("should not allow more than 2 decimal places", () => {
        const state: WithdrawalState = {
          ...initialWithdrawalState,
          amount: "12.34",
        };
        const action: WithdrawalAction = { type: "KEY_PRESS", payload: "5" };

        const result = withdrawalReducer(state, action);

        expect(result.amount).toBe("12.34");
      });
    });

    describe("backspace", () => {
      it("should remove last character", () => {
        const state: WithdrawalState = {
          ...initialWithdrawalState,
          amount: "123",
        };
        const action: WithdrawalAction = {
          type: "KEY_PRESS",
          payload: "backspace",
        };

        const result = withdrawalReducer(state, action);

        expect(result.amount).toBe("12");
      });

      it("should handle empty amount", () => {
        const state = initialWithdrawalState;
        const action: WithdrawalAction = {
          type: "KEY_PRESS",
          payload: "backspace",
        };

        const result = withdrawalReducer(state, action);

        expect(result.amount).toBe("");
      });

      it("should remove decimal point", () => {
        const state: WithdrawalState = {
          ...initialWithdrawalState,
          amount: "12.",
        };
        const action: WithdrawalAction = {
          type: "KEY_PRESS",
          payload: "backspace",
        };

        const result = withdrawalReducer(state, action);

        expect(result.amount).toBe("12");
      });
    });
  });

  describe("unknown action", () => {
    it("should return current state for unknown action", () => {
      const state = initialWithdrawalState;
      // @ts-expect-error - testing unknown action
      const action: WithdrawalAction = { type: "UNKNOWN" };

      const result = withdrawalReducer(state, action);

      expect(result).toBe(state);
    });
  });
});
