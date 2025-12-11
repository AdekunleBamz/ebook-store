/**
 * Ebook card component for marketplace listing
 */

import Link from "next/link";
import { Ebook, formatStx } from "../services/stacks";

interface EbookCardProps {
  ebook: Ebook;
  isAuthor?: boolean;
  showDownload?: boolean;
}

export default function EbookCard({ ebook, isAuthor, showDownload }: EbookCardProps) {
  // Truncate author address
  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  return (
    <Link href={showDownload ? `/download/${ebook.id}` : `/ebook/${ebook.id}`}>
      <div className="card hover:border-stacks-purple/50 transition-all cursor-pointer group">
        {/* Status Badge */}
        {isAuthor && (
          <div className="absolute top-3 right-3">
            <span className={`px-2 py-1 text-xs rounded-full ${
              ebook.active 
                ? "bg-green-500/20 text-green-400" 
                : "bg-red-500/20 text-red-400"
            }`}>
              {ebook.active ? "Active" : "Inactive"}
            </span>
          </div>
        )}
        
        {showDownload && (
          <div className="absolute top-3 right-3">
            <span className="px-2 py-1 text-xs rounded-full bg-stacks-purple/20 text-stacks-purple">
              Owned
            </span>
          </div>
        )}

        {/* Book Icon Placeholder */}
        <div className="w-full h-40 bg-gradient-to-br from-stacks-purple/20 to-stacks-purple/5 rounded-lg mb-4 flex items-center justify-center group-hover:from-stacks-purple/30 transition-all">
          <svg
            className="w-16 h-16 text-stacks-purple/60"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
          {ebook.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-white/60 mb-4 line-clamp-2">
          {ebook.description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="text-sm text-white/40">
            {isAuthor ? "You" : `by ${truncateAddress(ebook.author)}`}
          </div>
          <div className="text-stacks-purple font-semibold">
            {formatStx(ebook.price)}
          </div>
        </div>
      </div>
    </Link>
  );
}
