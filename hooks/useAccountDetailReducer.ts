import { useReducer, useCallback } from "react";

export interface AccountDetailState {
  name: string;
  goalEnabled: boolean;
  targetAmount: string;
}

export type AccountDetailAction =
  | { type: "SET_NAME"; payload: string }
  | { type: "SET_GOAL_ENABLED"; payload: boolean }
  | { type: "SET_TARGET_AMOUNT"; payload: string }
  | { type: "INITIALIZE"; payload: AccountDetailState };

export const initialAccountDetailState: AccountDetailState = {
  name: "",
  goalEnabled: true,
  targetAmount: "",
};

export function accountDetailReducer(
  state: AccountDetailState,
  action: AccountDetailAction
): AccountDetailState {
  switch (action.type) {
    case "SET_NAME":
      return { ...state, name: action.payload };

    case "SET_GOAL_ENABLED":
      return { ...state, goalEnabled: action.payload };

    case "SET_TARGET_AMOUNT":
      return { ...state, targetAmount: action.payload };

    case "INITIALIZE":
      return { ...action.payload };

    default:
      return state;
  }
}

export function useAccountDetailReducer(
  initialState = initialAccountDetailState
) {
  const [state, dispatch] = useReducer(accountDetailReducer, initialState);

  const setName = useCallback((name: string) => {
    dispatch({ type: "SET_NAME", payload: name });
  }, []);

  const setGoalEnabled = useCallback((enabled: boolean) => {
    dispatch({ type: "SET_GOAL_ENABLED", payload: enabled });
  }, []);

  const setTargetAmount = useCallback((amount: string) => {
    dispatch({ type: "SET_TARGET_AMOUNT", payload: amount });
  }, []);

  const initialize = useCallback((data: AccountDetailState) => {
    dispatch({ type: "INITIALIZE", payload: data });
  }, []);

  return {
    state,
    dispatch,
    setName,
    setGoalEnabled,
    setTargetAmount,
    initialize,
  };
}

