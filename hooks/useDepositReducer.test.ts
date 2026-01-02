import { describe, it, expect } from "vitest";
import {
  depositReducer,
  initialDepositState,
  DepositState,
  DepositAction,
} from "./useDepositReducer";

describe("depositReducer", () => {
  describe("initialDepositState", () => {
    it("should have empty amount", () => {
      expect(initialDepositState.amount).toBe("");
    });
  });

  describe("KEY_PRESS", () => {
    describe("numeric keys", () => {
      it("should append digit to empty amount", () => {
        const state = initialDepositState;
        const action: DepositAction = { type: "KEY_PRESS", payload: "5" };

        const result = depositReducer(state, action);

        expect(result.amount).toBe("5");
      });

      it("should append digit to existing amount", () => {
        const state: DepositState = { ...initialDepositState, amount: "12" };
        const action: DepositAction = { type: "KEY_PRESS", payload: "3" };

        const result = depositReducer(state, action);

        expect(result.amount).toBe("123");
      });

      it("should replace leading zero with digit", () => {
        const state: DepositState = { ...initialDepositState, amount: "0" };
        const action: DepositAction = { type: "KEY_PRESS", payload: "5" };

        const result = depositReducer(state, action);

        expect(result.amount).toBe("5");
      });
    });

    describe("decimal point", () => {
      it("should add leading zero when starting with decimal", () => {
        const state = initialDepositState;
        const action: DepositAction = { type: "KEY_PRESS", payload: "." };

        const result = depositReducer(state, action);

        expect(result.amount).toBe("0.");
      });

      it("should append decimal to existing amount", () => {
        const state: DepositState = { ...initialDepositState, amount: "12" };
        const action: DepositAction = { type: "KEY_PRESS", payload: "." };

        const result = depositReducer(state, action);

        expect(result.amount).toBe("12.");
      });

      it("should not allow multiple decimal points", () => {
        const state: DepositState = {
          ...initialDepositState,
          amount: "12.34",
        };
        const action: DepositAction = { type: "KEY_PRESS", payload: "." };

        const result = depositReducer(state, action);

        expect(result.amount).toBe("12.34");
      });
    });

    describe("decimal places limit", () => {
      it("should allow up to 2 decimal places", () => {
        const state: DepositState = {
          ...initialDepositState,
          amount: "12.3",
        };
        const action: DepositAction = { type: "KEY_PRESS", payload: "4" };

        const result = depositReducer(state, action);

        expect(result.amount).toBe("12.34");
      });

      it("should not allow more than 2 decimal places", () => {
        const state: DepositState = {
          ...initialDepositState,
          amount: "12.34",
        };
        const action: DepositAction = { type: "KEY_PRESS", payload: "5" };

        const result = depositReducer(state, action);

        expect(result.amount).toBe("12.34");
      });
    });

    describe("backspace", () => {
      it("should remove last character", () => {
        const state: DepositState = {
          ...initialDepositState,
          amount: "123",
        };
        const action: DepositAction = {
          type: "KEY_PRESS",
          payload: "backspace",
        };

        const result = depositReducer(state, action);

        expect(result.amount).toBe("12");
      });

      it("should handle empty amount", () => {
        const state = initialDepositState;
        const action: DepositAction = {
          type: "KEY_PRESS",
          payload: "backspace",
        };

        const result = depositReducer(state, action);

        expect(result.amount).toBe("");
      });

      it("should remove decimal point", () => {
        const state: DepositState = { ...initialDepositState, amount: "12." };
        const action: DepositAction = {
          type: "KEY_PRESS",
          payload: "backspace",
        };

        const result = depositReducer(state, action);

        expect(result.amount).toBe("12");
      });
    });
  });

  describe("unknown action", () => {
    it("should return current state for unknown action", () => {
      const state = initialDepositState;
      // @ts-expect-error - testing unknown action
      const action: DepositAction = { type: "UNKNOWN" };

      const result = depositReducer(state, action);

      expect(result).toBe(state);
    });
  });
});
