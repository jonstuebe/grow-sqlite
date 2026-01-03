import { describe, it, expect } from "vitest";
import {
  accountDetailReducer,
  initialAccountDetailState,
  AccountDetailState,
  AccountDetailAction,
} from "./useAccountDetailReducer";

describe("accountDetailReducer", () => {
  describe("initialAccountDetailState", () => {
    it("should have empty name", () => {
      expect(initialAccountDetailState.name).toBe("");
    });

    it("should have goalEnabled as true", () => {
      expect(initialAccountDetailState.goalEnabled).toBe(true);
    });

    it("should have empty targetAmount", () => {
      expect(initialAccountDetailState.targetAmount).toBe("");
    });
  });

  describe("SET_NAME", () => {
    it("should set name from empty state", () => {
      const state = initialAccountDetailState;
      const action: AccountDetailAction = {
        type: "SET_NAME",
        payload: "Vacation Fund",
      };

      const result = accountDetailReducer(state, action);

      expect(result.name).toBe("Vacation Fund");
    });

    it("should update existing name", () => {
      const state: AccountDetailState = {
        ...initialAccountDetailState,
        name: "Old Name",
      };
      const action: AccountDetailAction = {
        type: "SET_NAME",
        payload: "New Name",
      };

      const result = accountDetailReducer(state, action);

      expect(result.name).toBe("New Name");
    });

    it("should not affect other state properties", () => {
      const state: AccountDetailState = {
        name: "Test",
        goalEnabled: false,
        targetAmount: "1000",
      };
      const action: AccountDetailAction = {
        type: "SET_NAME",
        payload: "Updated",
      };

      const result = accountDetailReducer(state, action);

      expect(result.name).toBe("Updated");
      expect(result.goalEnabled).toBe(false);
      expect(result.targetAmount).toBe("1000");
    });

    it("should handle empty string", () => {
      const state: AccountDetailState = {
        ...initialAccountDetailState,
        name: "Has Name",
      };
      const action: AccountDetailAction = { type: "SET_NAME", payload: "" };

      const result = accountDetailReducer(state, action);

      expect(result.name).toBe("");
    });
  });

  describe("SET_GOAL_ENABLED", () => {
    it("should enable goal", () => {
      const state: AccountDetailState = {
        ...initialAccountDetailState,
        goalEnabled: false,
      };
      const action: AccountDetailAction = {
        type: "SET_GOAL_ENABLED",
        payload: true,
      };

      const result = accountDetailReducer(state, action);

      expect(result.goalEnabled).toBe(true);
    });

    it("should disable goal", () => {
      const state: AccountDetailState = {
        ...initialAccountDetailState,
        goalEnabled: true,
      };
      const action: AccountDetailAction = {
        type: "SET_GOAL_ENABLED",
        payload: false,
      };

      const result = accountDetailReducer(state, action);

      expect(result.goalEnabled).toBe(false);
    });

    it("should not affect other state properties", () => {
      const state: AccountDetailState = {
        name: "Savings",
        goalEnabled: true,
        targetAmount: "5000",
      };
      const action: AccountDetailAction = {
        type: "SET_GOAL_ENABLED",
        payload: false,
      };

      const result = accountDetailReducer(state, action);

      expect(result.name).toBe("Savings");
      expect(result.goalEnabled).toBe(false);
      expect(result.targetAmount).toBe("5000");
    });
  });

  describe("SET_TARGET_AMOUNT", () => {
    it("should set target amount from empty state", () => {
      const state = initialAccountDetailState;
      const action: AccountDetailAction = {
        type: "SET_TARGET_AMOUNT",
        payload: "1000",
      };

      const result = accountDetailReducer(state, action);

      expect(result.targetAmount).toBe("1000");
    });

    it("should update existing target amount", () => {
      const state: AccountDetailState = {
        ...initialAccountDetailState,
        targetAmount: "500",
      };
      const action: AccountDetailAction = {
        type: "SET_TARGET_AMOUNT",
        payload: "2500",
      };

      const result = accountDetailReducer(state, action);

      expect(result.targetAmount).toBe("2500");
    });

    it("should handle decimal values", () => {
      const state = initialAccountDetailState;
      const action: AccountDetailAction = {
        type: "SET_TARGET_AMOUNT",
        payload: "1234.56",
      };

      const result = accountDetailReducer(state, action);

      expect(result.targetAmount).toBe("1234.56");
    });

    it("should not affect other state properties", () => {
      const state: AccountDetailState = {
        name: "Emergency",
        goalEnabled: true,
        targetAmount: "1000",
      };
      const action: AccountDetailAction = {
        type: "SET_TARGET_AMOUNT",
        payload: "3000",
      };

      const result = accountDetailReducer(state, action);

      expect(result.name).toBe("Emergency");
      expect(result.goalEnabled).toBe(true);
      expect(result.targetAmount).toBe("3000");
    });

    it("should handle empty string", () => {
      const state: AccountDetailState = {
        ...initialAccountDetailState,
        targetAmount: "1000",
      };
      const action: AccountDetailAction = {
        type: "SET_TARGET_AMOUNT",
        payload: "",
      };

      const result = accountDetailReducer(state, action);

      expect(result.targetAmount).toBe("");
    });
  });

  describe("INITIALIZE", () => {
    it("should initialize all state from payload", () => {
      const state = initialAccountDetailState;
      const action: AccountDetailAction = {
        type: "INITIALIZE",
        payload: {
          name: "Travel Fund",
          goalEnabled: false,
          targetAmount: "5000",
        },
      };

      const result = accountDetailReducer(state, action);

      expect(result.name).toBe("Travel Fund");
      expect(result.goalEnabled).toBe(false);
      expect(result.targetAmount).toBe("5000");
    });

    it("should completely replace existing state", () => {
      const state: AccountDetailState = {
        name: "Old Account",
        goalEnabled: true,
        targetAmount: "1000",
      };
      const action: AccountDetailAction = {
        type: "INITIALIZE",
        payload: {
          name: "New Account",
          goalEnabled: false,
          targetAmount: "2000",
        },
      };

      const result = accountDetailReducer(state, action);

      expect(result.name).toBe("New Account");
      expect(result.goalEnabled).toBe(false);
      expect(result.targetAmount).toBe("2000");
    });

    it("should handle initializing with default values", () => {
      const state: AccountDetailState = {
        name: "Existing",
        goalEnabled: false,
        targetAmount: "999",
      };
      const action: AccountDetailAction = {
        type: "INITIALIZE",
        payload: initialAccountDetailState,
      };

      const result = accountDetailReducer(state, action);

      expect(result).toEqual(initialAccountDetailState);
    });
  });

  describe("unknown action", () => {
    it("should return current state for unknown action", () => {
      const state = initialAccountDetailState;
      // @ts-expect-error - testing unknown action
      const action: AccountDetailAction = { type: "UNKNOWN" };

      const result = accountDetailReducer(state, action);

      expect(result).toBe(state);
    });
  });
});

