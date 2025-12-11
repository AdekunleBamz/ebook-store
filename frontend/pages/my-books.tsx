/**
 * My Books page - Shows user's published and purchased ebooks
 */

import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import EbookCard from "../components/EbookCard";
import {
  isSignedIn,
  getUserAddress,
  getAuthorEbooks,
  getBuyerEbooks,
  getEbook,
  Ebook,
} from "../services/stacks";

export default function MyBooks() {
  const [publishedEbooks, setPublishedEbooks] = useState<Ebook[]>([]);
  const [purchasedEbooks, setPurchasedEbooks] = useState<Ebook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"published" | "purchased">("published");
  const [walletConnected, setWalletConnected] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const connected = isSignedIn();
      setWalletConnected(connected);
      if (connected) {
        loadMyBooks();
      } else {
        setIsLoading(false);
      }
    }
  }, []);

  const loadMyBooks = async () => {
    try {
      setIsLoading(true);
      const address = getUserAddress();
      if (!address) {
        setIsLoading(false);
        return;
      }

      // Get published ebooks (as author)
      const authorEbookIds = await getAuthorEbooks(address);
      const publishedPromises = authorEbookIds.map(async (id: number) => {
        const ebook = await getEbook(id);
        if (ebook) {
          return {
            id,
            title: ebook.title,
            description: ebook.description || "",
            contentHash: ebook["content-hash"] || "",
            price: Number(ebook.price),
            author: ebook.author,
            createdAt: Number(ebook["created-at"] || 0),
            active: ebook.active,
          } as Ebook;
        }
        return null;
      });
      const published = (await Promise.all(publishedPromises)).filter(Boolean) as Ebook[];
      setPublishedEbooks(published);

      // Get purchased ebooks (as buyer)
      const buyerEbookIds = await getBuyerEbooks(address);
      const purchasedPromises = buyerEbookIds.map(async (id: number) => {
        const ebook = await getEbook(id);
        if (ebook) {
          return {
            id,
            title: ebook.title,
            description: ebook.description || "",
            contentHash: ebook["content-hash"] || "",
            price: Number(ebook.price),
            author: ebook.author,
            createdAt: Number(ebook["created-at"] || 0),
            active: ebook.active,
          } as Ebook;
        }
        return null;
      });
      const purchased = (await Promise.all(purchasedPromises)).filter(Boolean) as Ebook[];
      setPurchasedEbooks(purchased);
    } catch (err) {
      console.error("Failed to load my books:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!walletConnected) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-6 bg-white/5 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h3>
          <p className="text-white/60 mb-6">
            Please connect your wallet to view your books.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">My Books</h1>
        <p className="text-white/60">
          View and manage your published and purchased ebooks.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-white/10">
        <button
          onClick={() => setActiveTab("published")}
          className={`pb-4 px-2 text-sm font-medium transition-colors ${
            activeTab === "published"
              ? "text-stacks-purple border-b-2 border-stacks-purple"
              : "text-white/60 hover:text-white"
          }`}
        >
          Published ({publishedEbooks.length})
        </button>
        <button
          onClick={() => setActiveTab("purchased")}
          className={`pb-4 px-2 text-sm font-medium transition-colors ${
            activeTab === "purchased"
              ? "text-stacks-purple border-b-2 border-stacks-purple"
              : "text-white/60 hover:text-white"
          }`}
        >
          Purchased ({purchasedEbooks.length})
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="spinner" />
        </div>
      )}

      {/* Published Tab */}
      {!isLoading && activeTab === "published" && (
        <>
          {publishedEbooks.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-6 bg-white/5 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No Published Books</h3>
              <p className="text-white/60 mb-6">
                You haven't published any ebooks yet.
              </p>
              <a href="/upload" className="btn-primary">
                Publish Your First eBook
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {publishedEbooks.map((ebook) => (
                <EbookCard key={ebook.id} ebook={ebook} isAuthor={true} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Purchased Tab */}
      {!isLoading && activeTab === "purchased" && (
        <>
          {purchasedEbooks.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-6 bg-white/5 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No Purchased Books</h3>
              <p className="text-white/60 mb-6">
                You haven't purchased any ebooks yet.
              </p>
              <a href="/" className="btn-primary">
                Browse Marketplace
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {purchasedEbooks.map((ebook) => (
                <EbookCard key={ebook.id} ebook={ebook} showDownload={true} />
              ))}
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
