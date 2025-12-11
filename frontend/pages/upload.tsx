/**
 * Upload page - Author ebook registration
 */

import { useState, FormEvent } from "react";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import {
  registerEbook,
  stxToMicroStx,
  isSignedIn,
  getUserAddress,
} from "../services/stacks";

export default function Upload() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txId, setTxId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [ipfsCid, setIpfsCid] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setTxId(null);

    // Validate wallet connection
    if (!isSignedIn()) {
      setError("Please connect your wallet first.");
      return;
    }

    // Validate form
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!description.trim()) {
      setError("Description is required.");
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      setError("Price must be greater than 0.");
      return;
    }
    if (!ipfsCid.trim()) {
      setError("IPFS CID is required. Upload your ebook to IPFS first.");
      return;
    }

    try {
      setIsLoading(true);

      // Convert IPFS CID to 32-byte hash
      const encoder = new TextEncoder();
      const data = encoder.encode(ipfsCid);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const contentHash = new Uint8Array(hashBuffer);

      // Convert price to microSTX
      const priceInMicroStx = stxToMicroStx(parseFloat(price));

      console.log("Submitting ebook:", { title, description, priceInMicroStx, ipfsCid });

      // Call contract
      await registerEbook(
        title,
        description,
        contentHash,
        priceInMicroStx,
        (data) => {
          // Transaction submitted - show txId and success message
          console.log("Transaction submitted:", data);
          setTxId(data.txId);
          setIsLoading(false);
        },
        () => {
          setIsLoading(false);
        }
      );
    } catch (err) {
      console.error("Registration failed:", err);
      setError("Failed to register ebook. Please try again.");
      setIsLoading(false);
    }
  };

  // Show success state after transaction submitted
  if (txId) {
    const explorerUrl = process.env.NEXT_PUBLIC_NETWORK === "mainnet"
      ? `https://explorer.stacks.co/txid/${txId}?chain=mainnet`
      : `https://explorer.stacks.co/txid/${txId}?chain=testnet`;

    return (
      <Layout>
        <div className="max-w-2xl mx-auto text-center py-12">
          <div className="w-20 h-20 mx-auto mb-6 bg-green-500/20 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Transaction Submitted! 🎉
          </h1>
          <p className="text-white/60 mb-6">
            Your ebook "{title}" has been submitted to the blockchain.
            <br />
            <strong className="text-white">Please wait 10-30 minutes</strong> for the transaction to confirm on mainnet.
          </p>
          
          <div className="bg-white/5 rounded-lg p-4 mb-6 break-all">
            <p className="text-xs text-white/40 mb-1">Transaction ID:</p>
            <code className="text-sm text-stacks-purple">{txId}</code>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary inline-flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View on Explorer
            </a>
            <button
              onClick={() => router.push("/my-books")}
              className="btn-primary"
            >
              Go to My Books
            </button>
          </div>

          <p className="text-sm text-white/40 mt-8">
            💡 Tip: Check the explorer link to see when your transaction confirms.
            Once confirmed, your ebook will appear in "My Books" and the marketplace.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Publish Your eBook</h1>
        <p className="text-white/60 mb-6 sm:mb-8 text-sm sm:text-base">
          Register your ebook on the blockchain. Once published, buyers can
          purchase directly through the smart contract.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter ebook title"
              className="input"
              maxLength={64}
              disabled={isLoading}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your ebook"
              className="input min-h-[120px] resize-none"
              maxLength={256}
              disabled={isLoading}
            />
            <p className="text-xs text-white/40 mt-1">
              {description.length}/256 characters
            </p>
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Price (STX)
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              className="input"
              step="0.000001"
              min="0.000001"
              disabled={isLoading}
            />
          </div>

          {/* IPFS CID */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              IPFS Content ID (CID)
            </label>
            <input
              type="text"
              value={ipfsCid}
              onChange={(e) => setIpfsCid(e.target.value)}
              placeholder="Qm... or bafy..."
              className="input"
              disabled={isLoading}
            />
            <p className="text-xs text-white/40 mt-1">
              Upload your encrypted ebook to IPFS first, then paste the CID here.
              <br />
              You can use <a href="https://app.pinata.cloud" target="_blank" rel="noopener noreferrer" className="text-stacks-purple hover:underline">Pinata</a> to upload files to IPFS for free.
            </p>
          </div>

          {/* File Upload (optional, for reference) */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              eBook File (for preview only)
            </label>
            <div className="border-2 border-dashed border-white/20 rounded-lg p-6 sm:p-8 text-center hover:border-stacks-purple/50 transition-colors">
              <input
                type="file"
                accept=".pdf,.epub"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
                id="file-upload"
                disabled={isLoading}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                {file ? (
                  <div>
                    <p className="text-white">{file.name}</p>
                    <p className="text-sm text-white/40">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div>
                    <svg
                      className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-white/40 mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <p className="text-white/60 text-sm">
                      Click to select PDF or EPUB file
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="spinner w-5 h-5" />
                Publishing...
              </>
            ) : (
              "Publish eBook"
            )}
          </button>
        </form>
      </div>
    </Layout>
  );
}
