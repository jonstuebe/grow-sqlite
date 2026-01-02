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

export interface TransferState {
  fromIndex: number | null;
  toIndex: number | null;
  amount: string;
}

export type TransferAction =
  | { type: "SET_FROM_INDEX"; payload: number }
  | { type: "SET_TO_INDEX"; payload: number }
  | { type: "SWAP_ACCOUNTS" }
  | { type: "KEY_PRESS"; payload: KeypadKey };

export const initialTransferState: TransferState = {
  fromIndex: null,
  toIndex: null,
  amount: "",
};

export function transferReducer(
  state: TransferState,
  action: TransferAction
): TransferState {
  switch (action.type) {
    case "SET_FROM_INDEX":
      return { ...state, fromIndex: action.payload };

    case "SET_TO_INDEX":
      return { ...state, toIndex: action.payload };

    case "SWAP_ACCOUNTS":
      // Only swap if both accounts are selected
      if (state.fromIndex === null || state.toIndex === null) {
        return state;
      }
      return {
        ...state,
        fromIndex: state.toIndex,
        toIndex: state.fromIndex,
      };

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

export function useTransferReducer(initialState = initialTransferState) {
  const [state, dispatch] = useReducer(transferReducer, initialState);

  const setFromIndex = useCallback((index: number) => {
    dispatch({ type: "SET_FROM_INDEX", payload: index });
  }, []);

  const setToIndex = useCallback((index: number) => {
    dispatch({ type: "SET_TO_INDEX", payload: index });
  }, []);

  const swapAccounts = useCallback(() => {
    dispatch({ type: "SWAP_ACCOUNTS" });
  }, []);

  const handleKeyPress = useCallback((key: KeypadKey) => {
    dispatch({ type: "KEY_PRESS", payload: key });
  }, []);

  return {
    state,
    dispatch,
    setFromIndex,
    setToIndex,
    swapAccounts,
    handleKeyPress,
  };
}
