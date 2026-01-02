import { useReducer, useCallback } from "react";

export type KeypadKey =
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "."
  | "0"
  | "backspace";

export interface WithdrawalState {
  amount: string;
}

export type WithdrawalAction = { type: "KEY_PRESS"; payload: KeypadKey };

export const initialWithdrawalState: WithdrawalState = {
  amount: "",
};

export function withdrawalReducer(
  state: WithdrawalState,
  action: WithdrawalAction
): WithdrawalState {
  switch (action.type) {
    case "KEY_PRESS": {
      const key = action.payload;
      const prev = state.amount;

      if (key === "backspace") {
        return { ...state, amount: prev.slice(0, -1) };
      }

      if (key === ".") {
        // Only allow one decimal point
        if (prev.includes(".")) return state;
        // Add leading zero if starting with decimal
        if (prev === "") return { ...state, amount: "0." };
        return { ...state, amount: prev + "." };
      }

      // Limit decimal places to 2
      const decimalIndex = prev.indexOf(".");
      if (decimalIndex !== -1 && prev.length - decimalIndex > 2) {
        return state;
      }

      // Prevent leading zeros
      if (prev === "0") {
        return { ...state, amount: key };
      }

      return { ...state, amount: prev + key };
    }

    default:
      return state;
  }
}

export function useWithdrawalReducer(initialState = initialWithdrawalState) {
  const [state, dispatch] = useReducer(withdrawalReducer, initialState);

  const handleKeyPress = useCallback((key: KeypadKey) => {
    dispatch({ type: "KEY_PRESS", payload: key });
  }, []);

  return {
    state,
    dispatch,
    handleKeyPress,
  };
}
