import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  startAdvertise,
  stopAdvertise,
  startDiscovery,
  stopDiscovery,
  requestConnection,
  acceptConnection,
  rejectConnection,
  disconnect,
  sendText,
  onPeerFound,
  onPeerLost,
  onInvitationReceived,
  onConnected,
  onDisconnected,
  onTextReceived,
  type PeerFound,
  type PeerLost,
  type InvitationReceived,
  type Connected,
  type Disconnected,
  type TextReceived,
} from "expo-nearby-connections";

export interface Peer {
  peerId: string;
  name: string;
}

export interface ReceivedMessage {
  peerId: string;
  text: string;
  timestamp: number;
}

export interface NearbyConnectionsContextValue {
  /** This device's peer ID (set after advertising/discovery starts) */
  myPeerId: string | null;
  /** List of discovered peers */
  discoveredPeers: Peer[];
  /** Currently connected peers */
  connectedPeers: Peer[];
  /** Pending invitation from another peer */
  pendingInvitation: Peer | null;
  /** Whether we're currently advertising */
  isAdvertising: boolean;
  /** Whether we're currently discovering */
  isDiscovering: boolean;
  /** Messages received from peers */
  receivedMessages: ReceivedMessage[];

  /** Start advertising this device */
  advertise: (name: string) => Promise<void>;
  /** Stop advertising */
  stopAdvertising: () => Promise<void>;
  /** Start discovering nearby peers */
  discover: (name: string) => Promise<void>;
  /** Stop discovering */
  stopDiscovering: () => Promise<void>;
  /** Request connection to a discovered peer */
  connect: (peerId: string) => Promise<void>;
  /** Accept a pending invitation */
  acceptInvitation: () => Promise<void>;
  /** Reject a pending invitation */
  rejectInvitation: () => Promise<void>;
  /** Disconnect from all peers */
  disconnectAll: () => Promise<void>;
  /** Send text data to a connected peer */
  send: (peerId: string, data: string) => Promise<void>;
  /** Broadcast text data to all connected peers */
  broadcast: (data: string) => Promise<void>;
  /** Clear received messages */
  clearMessages: () => void;
}

const NearbyConnectionsContext =
  createContext<NearbyConnectionsContextValue | null>(null);

interface NearbyConnectionsProviderProps {
  children: React.ReactNode;
}

export function NearbyConnectionsProvider({
  children,
}: NearbyConnectionsProviderProps) {
  const [myPeerId, setMyPeerId] = useState<string | null>(null);
  const [discoveredPeers, setDiscoveredPeers] = useState<Peer[]>([]);
  const [connectedPeers, setConnectedPeers] = useState<Peer[]>([]);
  const [pendingInvitation, setPendingInvitation] = useState<Peer | null>(null);
  const [isAdvertising, setIsAdvertising] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [receivedMessages, setReceivedMessages] = useState<ReceivedMessage[]>(
    []
  );

  // Track peer IDs and device name in refs so event handlers can access current values
  const myAdvertisePeerIdRef = useRef<string | null>(null);
  const myDiscoveryPeerIdRef = useRef<string | null>(null);
  const myDeviceNameRef = useRef<string | null>(null);

  // Set up event listeners
  useEffect(() => {
    const subscriptions = [
      onPeerFound((data: PeerFound) => {
        console.log("[nearby] Peer found:", data.name, data.peerId);
        setDiscoveredPeers((prev) => {
          // Filter out our own device (by ID or name) and avoid duplicates
          const isSelf =
            data.peerId === myAdvertisePeerIdRef.current ||
            data.peerId === myDiscoveryPeerIdRef.current ||
            data.name === myDeviceNameRef.current;
          const isDuplicate = prev.some((p) => p.peerId === data.peerId);

          if (isSelf || isDuplicate) {
            console.log(
              "[nearby] Filtering out peer - self:",
              isSelf,
              "duplicate:",
              isDuplicate
            );
            return prev;
          }
          return [...prev, { peerId: data.peerId, name: data.name }];
        });
      }),

      onPeerLost((data: PeerLost) => {
        console.log("[nearby] Peer lost:", data.peerId);
        setDiscoveredPeers((prev) =>
          prev.filter((p) => p.peerId !== data.peerId)
        );
      }),

      onInvitationReceived((data: InvitationReceived) => {
        console.log(
          "[nearby] Invitation received from:",
          data.name,
          data.peerId
        );
        setPendingInvitation({ peerId: data.peerId, name: data.name });
      }),

      onConnected((data: Connected) => {
        console.log("[nearby] Connected to:", data.name, data.peerId);
        setConnectedPeers((prev) => {
          if (prev.some((p) => p.peerId === data.peerId)) {
            return prev;
          }
          return [...prev, { peerId: data.peerId, name: data.name }];
        });
        // Clear pending invitation if this was the peer we accepted
        setPendingInvitation((prev) =>
          prev?.peerId === data.peerId ? null : prev
        );
      }),

      onDisconnected((data: Disconnected) => {
        console.log("[nearby] Disconnected from:", data.peerId);
        setConnectedPeers((prev) =>
          prev.filter((p) => p.peerId !== data.peerId)
        );
      }),

      onTextReceived((data: TextReceived) => {
        console.log("[nearby] Text received from:", data.peerId);
        setReceivedMessages((prev) => [
          ...prev,
          { peerId: data.peerId, text: data.text, timestamp: Date.now() },
        ]);
      }),
    ];

    return () => {
      subscriptions.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  const advertise = useCallback(async (name: string) => {
    console.log("[nearby] Starting advertise as:", name);
    myDeviceNameRef.current = name;
    const peerId = await startAdvertise(name);
    console.log("[nearby] Advertise started, peerId:", peerId);
    myAdvertisePeerIdRef.current = peerId;
    setMyPeerId(peerId);
    setIsAdvertising(true);
  }, []);

  const stopAdvertisingFn = useCallback(async () => {
    console.log("[nearby] Stopping advertise");
    await stopAdvertise();
    setIsAdvertising(false);
  }, []);

  const discover = useCallback(async (name: string) => {
    console.log("[nearby] Starting discovery as:", name);
    myDeviceNameRef.current = name;
    const peerId = await startDiscovery(name);
    console.log("[nearby] Discovery started, peerId:", peerId);
    myDiscoveryPeerIdRef.current = peerId;
    // Only set myPeerId if not already set by advertise
    setMyPeerId((prev) => prev ?? peerId);
    setIsDiscovering(true);
  }, []);

  const stopDiscoveringFn = useCallback(async () => {
    console.log("[nearby] Stopping discovery");
    await stopDiscovery();
    setIsDiscovering(false);
    setDiscoveredPeers([]);
  }, []);

  const connect = useCallback(async (peerId: string) => {
    console.log("[nearby] Requesting connection to:", peerId);
    await requestConnection(peerId);
    console.log("[nearby] Connection request sent");
  }, []);

  const acceptInvitationFn = useCallback(async () => {
    if (pendingInvitation) {
      console.log(
        "[nearby] Accepting invitation from:",
        pendingInvitation.name
      );
      await acceptConnection(pendingInvitation.peerId);
      setPendingInvitation(null);
      console.log("[nearby] Invitation accepted");
    }
  }, [pendingInvitation]);

  const rejectInvitationFn = useCallback(async () => {
    if (pendingInvitation) {
      await rejectConnection(pendingInvitation.peerId);
      setPendingInvitation(null);
    }
  }, [pendingInvitation]);

  const disconnectAllFn = useCallback(async () => {
    await disconnect();
    setConnectedPeers([]);
  }, []);

  const send = useCallback(async (peerId: string, data: string) => {
    await sendText(peerId, data);
  }, []);

  const broadcast = useCallback(
    async (data: string) => {
      await Promise.all(
        connectedPeers.map((peer) => sendText(peer.peerId, data))
      );
    },
    [connectedPeers]
  );

  const clearMessages = useCallback(() => {
    setReceivedMessages([]);
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopAdvertise().catch(() => {});
      stopDiscovery().catch(() => {});
      disconnect().catch(() => {});
    };
  }, []);

  const value: NearbyConnectionsContextValue = {
    myPeerId,
    discoveredPeers,
    connectedPeers,
    pendingInvitation,
    isAdvertising,
    isDiscovering,
    receivedMessages,
    advertise,
    stopAdvertising: stopAdvertisingFn,
    discover,
    stopDiscovering: stopDiscoveringFn,
    connect,
    acceptInvitation: acceptInvitationFn,
    rejectInvitation: rejectInvitationFn,
    disconnectAll: disconnectAllFn,
    send,
    broadcast,
    clearMessages,
  };

  return (
    <NearbyConnectionsContext.Provider value={value}>
      {children}
    </NearbyConnectionsContext.Provider>
  );
}

export function useNearbyConnections() {
  const context = useContext(NearbyConnectionsContext);
  if (!context) {
    throw new Error(
      "useNearbyConnections must be used within a NearbyConnectionsProvider"
    );
  }
  return context;
}
