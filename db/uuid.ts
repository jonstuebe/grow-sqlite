import * as Crypto from "expo-crypto";

/**
 * Generate a UUID v4 for use as database record IDs
 * Uses Crypto.randomUUID() which is available in React Native's Hermes engine
 */
export function uuid(): string {
  return Crypto.randomUUID();
}
