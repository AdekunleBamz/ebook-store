/**
 * Stacks blockchain service for eBook Store
 * Handles wallet connection, contract interactions, and transactions
 */

import {
  AppConfig,
  UserSession,
  showConnect,
  openContractCall,
} from "@stacks/connect";
import {
  StacksMainnet,
  StacksTestnet,
  StacksDevnet,
} from "@stacks/network";
import {
  uintCV,
  stringUtf8CV,
  bufferCV,
  principalCV,
  cvToValue,
  callReadOnlyFunction,
  ClarityValue,
} from "@stacks/transactions";

// Configuration
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "SP31G2FZ5JN87BATZMP4ZRYE5F7WZQDNEXJ7G7X97";
const CONTRACT_NAME = "ebook-store";

// Debug log
console.log("Contract Config:", { CONTRACT_ADDRESS, CONTRACT_NAME, NETWORK: process.env.NEXT_PUBLIC_NETWORK });

// App configuration for Leather/Hiro Wallet
const appConfig = new AppConfig(["store_write", "publish_data"]);
export const userSession = new UserSession({ appConfig });

// Get network based on environment
export const getNetwork = () => {
  const networkEnv = process.env.NEXT_PUBLIC_NETWORK || "mainnet";
  console.log("Using network:", networkEnv);
  switch (networkEnv) {
    case "mainnet":
      return new StacksMainnet();
    case "testnet":
      return new StacksTestnet();
    default:
      return new StacksDevnet();
  }
};

// ==============================================================================
// WALLET CONNECTION
// ==============================================================================

/**
 * Connect to Leather/Hiro Wallet
 */
export const connectWallet = (onFinish?: (userData: any) => void) => {
  showConnect({
    appDetails: {
      name: "eBook Store",
      icon: "/favicon.ico",
    },
    redirectTo: "/",
    onFinish: () => {
      const userData = userSession.loadUserData();
      console.log("Wallet connected:", userData);
      onFinish?.(userData);
    },
    userSession,
  });
};

/**
 * Disconnect wallet
 */
export const disconnectWallet = () => {
  userSession.signUserOut();
};

/**
 * Check if user is signed in
 */
export const isSignedIn = () => {
  if (typeof window === "undefined") return false;
  return userSession.isUserSignedIn();
};

/**
 * Get current user's STX address
 */
export const getUserAddress = (): string | null => {
  if (!isSignedIn()) return null;
  const userData = userSession.loadUserData();
  const network = process.env.NEXT_PUBLIC_NETWORK || "mainnet";
  const address = network === "mainnet"
    ? userData.profile.stxAddress.mainnet
    : userData.profile.stxAddress.testnet;
  console.log("User address:", address, "Network:", network);
  return address;
};

// ==============================================================================
// READ-ONLY CONTRACT CALLS
// ==============================================================================

/**
 * Fetch ebook details by ID
 */
export const getEbook = async (ebookId: number) => {
  try {
    const network = getNetwork();
    console.log(`Fetching ebook ${ebookId} from ${CONTRACT_ADDRESS}.${CONTRACT_NAME}`);
    const result = await callReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "get-ebook",
      functionArgs: [uintCV(ebookId)],
      network,
      senderAddress: CONTRACT_ADDRESS,
    });
    const value = cvToValue(result);
    console.log(`Ebook ${ebookId} result:`, value);
    return value;
  } catch (err) {
    console.error(`Error fetching ebook ${ebookId}:`, err);
    return null;
  }
};

/**
 * Get total number of ebooks
 */
export const getEbookCount = async (): Promise<number> => {
  try {
    const network = getNetwork();
    console.log(`Fetching ebook count from ${CONTRACT_ADDRESS}.${CONTRACT_NAME}`);
    const result = await callReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "get-ebook-count",
      functionArgs: [],
      network,
      senderAddress: CONTRACT_ADDRESS,
    });
    const count = Number(cvToValue(result));
    console.log("Ebook count:", count);
    return count;
  } catch (err) {
    console.error("Error fetching ebook count:", err);
    return 0;
  }
};

/**
 * Check if user has access to an ebook
 */
export const hasAccess = async (
  buyerAddress: string,
  ebookId: number
): Promise<boolean> => {
  try {
    const network = getNetwork();
    const result = await callReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "has-access",
      functionArgs: [principalCV(buyerAddress), uintCV(ebookId)],
      network,
      senderAddress: CONTRACT_ADDRESS,
    });
    return cvToValue(result) as boolean;
  } catch (err) {
    console.error("Error checking access:", err);
    return false;
  }
};

/**
 * Get all ebooks by an author
 */
export const getAuthorEbooks = async (authorAddress: string): Promise<number[]> => {
  try {
    const network = getNetwork();
    console.log(`Fetching author ebooks for ${authorAddress}`);
    const result = await callReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "get-author-ebooks",
      functionArgs: [principalCV(authorAddress)],
      network,
      senderAddress: CONTRACT_ADDRESS,
    });
    const ids = cvToValue(result) as number[];
    console.log("Author ebook IDs:", ids);
    return ids || [];
  } catch (err) {
    console.error("Error fetching author ebooks:", err);
    return [];
  }
};

/**
 * Get all ebooks owned by a buyer
 */
export const getBuyerEbooks = async (buyerAddress: string): Promise<number[]> => {
  try {
    const network = getNetwork();
    console.log(`Fetching buyer ebooks for ${buyerAddress}`);
    const result = await callReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "get-buyer-ebooks",
      functionArgs: [principalCV(buyerAddress)],
      network,
      senderAddress: CONTRACT_ADDRESS,
    });
    const ids = cvToValue(result) as number[];
    console.log("Buyer ebook IDs:", ids);
    return ids || [];
  } catch (err) {
    console.error("Error fetching buyer ebooks:", err);
    return [];
  }
};

/**
 * Check if user is the author of an ebook
 */
export const isAuthor = async (
  ebookId: number,
  userAddress: string
): Promise<boolean> => {
  try {
    const network = getNetwork();
    const result = await callReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "is-author",
      functionArgs: [uintCV(ebookId), principalCV(userAddress)],
      network,
      senderAddress: CONTRACT_ADDRESS,
    });
    return cvToValue(result) as boolean;
  } catch (err) {
    console.error("Error checking author:", err);
    return false;
  }
};

// ==============================================================================
// PUBLIC CONTRACT CALLS (TRANSACTIONS)
// ==============================================================================

/**
 * Register a new ebook
 */
export const registerEbook = async (
  title: string,
  description: string,
  contentHash: Uint8Array,
  price: number,
  onFinish?: (data: any) => void,
  onCancel?: () => void
) => {
  const network = getNetwork();
  console.log("Registering ebook:", { title, price, CONTRACT_ADDRESS, CONTRACT_NAME });
  
  await openContractCall({
    network,
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "register-ebook",
    functionArgs: [
      stringUtf8CV(title),
      stringUtf8CV(description),
      bufferCV(contentHash),
      uintCV(price),
    ],
    postConditionMode: 0x01, // Allow
    onFinish: (data) => {
      console.log("Ebook registered:", data);
      onFinish?.(data);
    },
    onCancel: () => {
      console.log("Registration cancelled");
      onCancel?.();
    },
  });
};

/**
 * Purchase an ebook
 */
export const buyEbook = async (
  ebookId: number,
  onFinish?: (data: any) => void,
  onCancel?: () => void
) => {
  const network = getNetwork();
  
  await openContractCall({
    network,
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "buy-ebook",
    functionArgs: [uintCV(ebookId)],
    postConditionMode: 0x01, // Allow
    onFinish: (data) => {
      console.log("Ebook purchased:", data);
      onFinish?.(data);
    },
    onCancel: () => {
      console.log("Purchase cancelled");
      onCancel?.();
    },
  });
};

/**
 * Update ebook price (author only)
 */
export const updatePrice = async (
  ebookId: number,
  newPrice: number,
  onFinish?: (data: any) => void,
  onCancel?: () => void
) => {
  const network = getNetwork();
  
  await openContractCall({
    network,
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "update-price",
    functionArgs: [uintCV(ebookId), uintCV(newPrice)],
    postConditionMode: 0x01,
    onFinish: (data) => {
      console.log("Price updated:", data);
      onFinish?.(data);
    },
    onCancel: () => {
      console.log("Price update cancelled");
      onCancel?.();
    },
  });
};

/**
 * Deactivate an ebook (author only)
 */
export const deactivateEbook = async (
  ebookId: number,
  onFinish?: (data: any) => void,
  onCancel?: () => void
) => {
  const network = getNetwork();
  
  await openContractCall({
    network,
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "deactivate-ebook",
    functionArgs: [uintCV(ebookId)],
    postConditionMode: 0x01,
    onFinish: (data) => {
      console.log("Ebook deactivated:", data);
      onFinish?.(data);
    },
    onCancel: () => {
      console.log("Deactivation cancelled");
      onCancel?.();
    },
  });
};

// ==============================================================================
// UTILITY FUNCTIONS
// ==============================================================================

/**
 * Convert STX to microSTX
 */
export const stxToMicroStx = (stx: number): number => {
  return Math.floor(stx * 1_000_000);
};

/**
 * Convert microSTX to STX
 */
export const microStxToStx = (microStx: number): number => {
  return microStx / 1_000_000;
};

/**
 * Format STX amount for display
 */
export const formatStx = (microStx: number): string => {
  return `${microStxToStx(microStx).toFixed(6)} STX`;
};

// ==============================================================================
// EBOOK TYPE DEFINITION
// ==============================================================================

export interface Ebook {
  id: number;
  title: string;
  description: string;
  contentHash: string;
  price: number;
  author: string;
  createdAt: number;
  active: boolean;
}

/**
 * Fetch all ebooks (active and inactive for full listing)
 */
export const getAllEbooks = async (): Promise<Ebook[]> => {
  try {
    const count = await getEbookCount();
    console.log(`Fetching all ${count} ebooks...`);
    const ebooks: Ebook[] = [];
    
    for (let i = 1; i <= count; i++) {
      const ebook = await getEbook(i);
      console.log(`Ebook ${i}:`, ebook);
      if (ebook) {
        // Only show active ebooks on homepage
        if (ebook.active) {
          ebooks.push({
            id: i,
            title: ebook.title || "",
            description: ebook.description || "",
            contentHash: ebook["content-hash"] || "",
            price: Number(ebook.price) || 0,
            author: ebook.author || "",
            createdAt: Number(ebook["created-at"] || 0),
            active: ebook.active,
          });
        }
      }
    }
    
    console.log("All ebooks loaded:", ebooks);
    return ebooks;
  } catch (err) {
    console.error("Error fetching all ebooks:", err);
    return [];
  }
};

/**
 * Fetch ebooks by author (includes inactive)
 */
export const getEbooksByAuthor = async (authorAddress: string): Promise<Ebook[]> => {
  try {
    const ebookIds = await getAuthorEbooks(authorAddress);
    console.log(`Fetching ${ebookIds.length} ebooks for author ${authorAddress}`);
    const ebooks: Ebook[] = [];
    
    for (const id of ebookIds) {
      const ebook = await getEbook(id);
      if (ebook) {
        ebooks.push({
          id,
          title: ebook.title || "",
          description: ebook.description || "",
          contentHash: ebook["content-hash"] || "",
          price: Number(ebook.price) || 0,
          author: ebook.author || "",
          createdAt: Number(ebook["created-at"] || 0),
          active: ebook.active,
        });
      }
    }
    
    return ebooks;
  } catch (err) {
    console.error("Error fetching author ebooks:", err);
    return [];
  }
};
