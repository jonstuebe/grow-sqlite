/**
 * Hook and component for app-wide background advertising
 * Manages nearby connections advertising lifecycle based on AppState
 *
 * CRITICAL: expo-nearby-connections cannot have both advertising and discovery
 * active at the same time. The sync screen must pause advertising while discovering.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AppState, type AppStateStatus } from "react-native";

import { useNearbyConnections } from "@/context/nearby-connections";
import { generateDeviceName } from "@/utils/device-name";

interface BackgroundAdvertisingContextValue {
  deviceName: string;
  isAdvertising: boolean;
  /** Pause advertising (call before starting discovery) */
  pauseAdvertising: () => Promise<void>;
  /** Resume advertising (call after stopping discovery) */
  resumeAdvertising: () => Promise<void>;
}

const BackgroundAdvertisingContext =
  createContext<BackgroundAdvertisingContextValue | null>(null);

interface BackgroundAdvertisingProviderProps {
  children: ReactNode;
}

export function BackgroundAdvertisingProvider({
  children,
}: BackgroundAdvertisingProviderProps) {
  // Generate device name once on mount
  const [deviceName] = useState(() => generateDeviceName());

  const { advertise, stopAdvertising, isAdvertising } = useNearbyConnections();

  // Track app state and pause state
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const isPausedRef = useRef(false);

  const startAdvertisingIfAllowed = useCallback(async () => {
    if (isPausedRef.current) {
      console.log("[advertising] Paused, not starting");
      return;
    }
    await advertise(deviceName);
  }, [deviceName, advertise]);

  const pauseAdvertising = useCallback(async () => {
    isPausedRef.current = true;
    await stopAdvertising();
    console.log("[advertising] Paused");
  }, [stopAdvertising]);

  const resumeAdvertising = useCallback(async () => {
    isPausedRef.current = false;
    // Only resume if app is active
    if (appStateRef.current === "active") {
      await advertise(deviceName);
      console.log("[advertising] Resumed");
    }
  }, [deviceName, advertise]);

  // Start advertising on mount, handle AppState changes
  useEffect(() => {
    // Start advertising immediately if app is active
    if (appStateRef.current === "active") {
      startAdvertisingIfAllowed().catch(console.error);
    }

    const subscription = AppState.addEventListener("change", (nextState) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextState;

      if (previousState !== "active" && nextState === "active") {
        // App came to foreground - restart advertising (if not paused)
        console.log("[advertising] App became active");
        startAdvertisingIfAllowed().catch(console.error);
      } else if (previousState === "active" && nextState !== "active") {
        // App going to background - stop advertising
        console.log(
          "[advertising] App going to background, stopping advertising"
        );
        stopAdvertising().catch(console.error);
      }
    });

    // Cleanup on unmount
    return () => {
      subscription.remove();
      stopAdvertising().catch(() => {});
    };
  }, [deviceName, startAdvertisingIfAllowed, stopAdvertising]);

  return (
    <BackgroundAdvertisingContext.Provider
      value={{ deviceName, isAdvertising, pauseAdvertising, resumeAdvertising }}
    >
      {children}
    </BackgroundAdvertisingContext.Provider>
  );
}

export function useBackgroundAdvertising() {
  const context = useContext(BackgroundAdvertisingContext);
  if (!context) {
    throw new Error(
      "useBackgroundAdvertising must be used within a BackgroundAdvertisingProvider"
    );
  }
  return context;
}
