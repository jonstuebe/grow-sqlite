import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createActor } from "xstate";
import { syncMachine, type SyncContext, type SyncEvent } from "./syncMachine";

describe("syncMachine", () => {
  const defaultInput = { deviceName: "Test Device" };

  function createTestActor() {
    return createActor(syncMachine, { input: defaultInput });
  }

  describe("initial state", () => {
    it("should start in discovering state", () => {
      const actor = createTestActor();
      actor.start();

      expect(actor.getSnapshot().value).toBe("discovering");
      actor.stop();
    });

    it("should have correct initial context", () => {
      const actor = createTestActor();
      actor.start();

      const { context } = actor.getSnapshot();
      expect(context.deviceName).toBe("Test Device");
      expect(context.syncingPeerId).toBeNull();
      expect(context.pendingSyncPeerId).toBeNull();
      expect(context.lastError).toBeNull();
      expect(context.mergeResult).toBeNull();

      actor.stop();
    });
  });

  describe("discovering state", () => {
    it("should transition to syncing.connecting on START_SYNC", () => {
      const actor = createTestActor();
      actor.start();

      actor.send({ type: "START_SYNC", peerId: "peer-123" });

      expect(actor.getSnapshot().value).toEqual({ syncing: "connecting" });
      expect(actor.getSnapshot().context.pendingSyncPeerId).toBe("peer-123");
      actor.stop();
    });

    it("should transition to syncing.responding on SYNC_REQUESTED", () => {
      const actor = createTestActor();
      actor.start();

      actor.send({ type: "SYNC_REQUESTED", peerId: "peer-123" });

      expect(actor.getSnapshot().value).toEqual({ syncing: "responding" });
      expect(actor.getSnapshot().context.syncingPeerId).toBe("peer-123");
      actor.stop();
    });
  });

  describe("syncing.connecting state", () => {
    it("should transition to requesting on PEER_CONNECTED with matching peer", () => {
      const actor = createTestActor();
      actor.start();

      actor.send({ type: "START_SYNC", peerId: "peer-123" });
      actor.send({ type: "PEER_CONNECTED", peerId: "peer-123" });

      expect(actor.getSnapshot().value).toEqual({ syncing: "requesting" });
      expect(actor.getSnapshot().context.syncingPeerId).toBe("peer-123");
      expect(actor.getSnapshot().context.pendingSyncPeerId).toBeNull();

      actor.stop();
    });

    it("should NOT transition on PEER_CONNECTED with non-matching peer", () => {
      const actor = createTestActor();
      actor.start();

      actor.send({ type: "START_SYNC", peerId: "peer-123" });
      actor.send({ type: "PEER_CONNECTED", peerId: "peer-different" });

      expect(actor.getSnapshot().value).toEqual({ syncing: "connecting" });
      expect(actor.getSnapshot().context.pendingSyncPeerId).toBe("peer-123");

      actor.stop();
    });

    it("should transition to error on CONNECTION_FAILED", () => {
      const actor = createTestActor();
      actor.start();

      actor.send({ type: "START_SYNC", peerId: "peer-123" });
      actor.send({ type: "CONNECTION_FAILED", error: "Connection timeout" });

      expect(actor.getSnapshot().value).toBe("error");
      expect(actor.getSnapshot().context.lastError).toBe("Connection timeout");
      expect(actor.getSnapshot().context.pendingSyncPeerId).toBeNull();

      actor.stop();
    });

    it("should timeout after 30 seconds if connection is not established", () => {
      vi.useFakeTimers();

      const actor = createTestActor();
      actor.start();

      actor.send({ type: "START_SYNC", peerId: "peer-123" });
      expect(actor.getSnapshot().value).toEqual({ syncing: "connecting" });

      // Advance time by 30 seconds
      vi.advanceTimersByTime(30000);

      expect(actor.getSnapshot().value).toBe("error");
      expect(actor.getSnapshot().context.lastError).toBe(
        "Connection timed out. The invitation may have been declined."
      );
      expect(actor.getSnapshot().context.pendingSyncPeerId).toBeNull();

      actor.stop();
      vi.useRealTimers();
    });

    it("should NOT timeout if connection is established before 30 seconds", () => {
      vi.useFakeTimers();

      const actor = createTestActor();
      actor.start();

      actor.send({ type: "START_SYNC", peerId: "peer-123" });
      expect(actor.getSnapshot().value).toEqual({ syncing: "connecting" });

      // Advance time by 15 seconds (before timeout)
      vi.advanceTimersByTime(15000);

      // Connection established
      actor.send({ type: "PEER_CONNECTED", peerId: "peer-123" });
      expect(actor.getSnapshot().value).toEqual({ syncing: "requesting" });

      // Advance past the original timeout point
      vi.advanceTimersByTime(20000);

      // Should still be in requesting, not error
      expect(actor.getSnapshot().value).toEqual({ syncing: "requesting" });

      actor.stop();
      vi.useRealTimers();
    });
  });

  describe("syncing states", () => {
    it("should transition requesting -> processingResponse on SYNC_RESPONSE_RECEIVED", () => {
      const actor = createTestActor();
      actor.start();

      // Get to requesting state
      actor.send({ type: "START_SYNC", peerId: "peer-123" });
      actor.send({ type: "PEER_CONNECTED", peerId: "peer-123" });
      expect(actor.getSnapshot().value).toEqual({ syncing: "requesting" });

      actor.send({
        type: "SYNC_RESPONSE_RECEIVED",
        peerId: "peer-123",
        accounts: [],
        transactions: [],
      });

      expect(actor.getSnapshot().value).toEqual({ syncing: "processingResponse" });

      actor.stop();
    });

    it("should transition responding -> processingData on SYNC_DATA_RECEIVED", () => {
      const actor = createTestActor();
      actor.start();

      // Get to responding state (receiver mode)
      actor.send({ type: "SYNC_REQUESTED", peerId: "peer-123" });
      expect(actor.getSnapshot().value).toEqual({ syncing: "responding" });

      actor.send({
        type: "SYNC_DATA_RECEIVED",
        peerId: "peer-123",
        accounts: [],
        transactions: [],
      });

      expect(actor.getSnapshot().value).toEqual({ syncing: "processingData" });

      actor.stop();
    });

    it("should transition to success on successful SYNC_ACK_RECEIVED", () => {
      const actor = createTestActor();
      actor.start();

      // Get to syncing state
      actor.send({ type: "START_SYNC", peerId: "peer-123" });
      actor.send({ type: "PEER_CONNECTED", peerId: "peer-123" });

      actor.send({
        type: "SYNC_ACK_RECEIVED",
        success: true,
        accountsMerged: 5,
        transactionsMerged: 10,
      });

      expect(actor.getSnapshot().value).toBe("success");
      expect(actor.getSnapshot().context.mergeResult).toEqual({
        accountsMerged: 5,
        transactionsMerged: 10,
      });

      actor.stop();
    });

    it("should transition to error on failed SYNC_ACK_RECEIVED", () => {
      const actor = createTestActor();
      actor.start();

      actor.send({ type: "START_SYNC", peerId: "peer-123" });
      actor.send({ type: "PEER_CONNECTED", peerId: "peer-123" });

      actor.send({
        type: "SYNC_ACK_RECEIVED",
        success: false,
        accountsMerged: 0,
        transactionsMerged: 0,
        error: "Database error",
      });

      expect(actor.getSnapshot().value).toBe("error");
      expect(actor.getSnapshot().context.lastError).toBe("Database error");

      actor.stop();
    });

    it("should transition to error on SYNC_ERROR", () => {
      const actor = createTestActor();
      actor.start();

      actor.send({ type: "START_SYNC", peerId: "peer-123" });
      actor.send({ type: "PEER_CONNECTED", peerId: "peer-123" });

      actor.send({ type: "SYNC_ERROR", error: "Network failure" });

      expect(actor.getSnapshot().value).toBe("error");
      expect(actor.getSnapshot().context.lastError).toBe("Network failure");

      actor.stop();
    });
  });

  describe("success state", () => {
    it("should return to discovering on RESET", () => {
      const actor = createTestActor();
      actor.start();

      // Start sync
      actor.send({ type: "START_SYNC", peerId: "peer-123" });
      actor.send({ type: "PEER_CONNECTED", peerId: "peer-123" });
      actor.send({
        type: "SYNC_ACK_RECEIVED",
        success: true,
        accountsMerged: 1,
        transactionsMerged: 2,
      });

      expect(actor.getSnapshot().value).toBe("success");

      actor.send({ type: "RESET" });

      expect(actor.getSnapshot().value).toBe("discovering");
      expect(actor.getSnapshot().context.syncingPeerId).toBeNull();
      expect(actor.getSnapshot().context.mergeResult).toBeNull();

      actor.stop();
    });
  });

  describe("error state", () => {
    it("should return to discovering on RESET", () => {
      const actor = createTestActor();
      actor.start();

      actor.send({ type: "START_SYNC", peerId: "peer-123" });
      actor.send({ type: "CONNECTION_FAILED", error: "Timeout" });

      expect(actor.getSnapshot().value).toBe("error");

      actor.send({ type: "RESET" });

      expect(actor.getSnapshot().value).toBe("discovering");
      expect(actor.getSnapshot().context.lastError).toBeNull();

      actor.stop();
    });
  });

  describe("full sync flow (initiator)", () => {
    it("should complete full initiator sync flow", () => {
      const actor = createTestActor();
      actor.start();

      // 1. Start in discovering
      expect(actor.getSnapshot().value).toBe("discovering");

      // 2. Start sync with discovered peer
      actor.send({ type: "START_SYNC", peerId: "peer-123" });
      expect(actor.getSnapshot().value).toEqual({ syncing: "connecting" });

      // 3. Peer connects
      actor.send({ type: "PEER_CONNECTED", peerId: "peer-123" });
      expect(actor.getSnapshot().value).toEqual({ syncing: "requesting" });

      // 4. Receive response
      actor.send({
        type: "SYNC_RESPONSE_RECEIVED",
        peerId: "peer-123",
        accounts: [],
        transactions: [],
      });
      expect(actor.getSnapshot().value).toEqual({ syncing: "processingResponse" });

      // 5. Receive ack
      actor.send({
        type: "SYNC_ACK_RECEIVED",
        success: true,
        accountsMerged: 3,
        transactionsMerged: 7,
      });
      expect(actor.getSnapshot().value).toBe("success");
      expect(actor.getSnapshot().context.mergeResult).toEqual({
        accountsMerged: 3,
        transactionsMerged: 7,
      });

      // 6. Reset returns to discovering
      actor.send({ type: "RESET" });
      expect(actor.getSnapshot().value).toBe("discovering");

      actor.stop();
    });
  });

  describe("full sync flow (receiver)", () => {
    it("should complete full receiver sync flow", () => {
      const actor = createTestActor();
      actor.start();

      // 1. Start in discovering (ready to receive)
      expect(actor.getSnapshot().value).toBe("discovering");

      // 2. Receive sync request from another device
      actor.send({ type: "SYNC_REQUESTED", peerId: "peer-456" });
      expect(actor.getSnapshot().value).toEqual({ syncing: "responding" });
      expect(actor.getSnapshot().context.syncingPeerId).toBe("peer-456");

      // 3. Receive their data
      actor.send({
        type: "SYNC_DATA_RECEIVED",
        peerId: "peer-456",
        accounts: [],
        transactions: [],
      });
      expect(actor.getSnapshot().value).toEqual({ syncing: "processingData" });

      // 4. Complete with ack
      actor.send({
        type: "SYNC_ACK_RECEIVED",
        success: true,
        accountsMerged: 2,
        transactionsMerged: 5,
      });
      expect(actor.getSnapshot().value).toBe("success");

      // 5. Reset returns to discovering
      actor.send({ type: "RESET" });
      expect(actor.getSnapshot().value).toBe("discovering");

      actor.stop();
    });
  });
});
