'use client'

import { Search, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { getProductSuggestions } from "@/lib/search/products";

const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "$";

const SearchAutocomplete = ({
  className = "",
  inputClassName = "",
  isMobile = false,
  onNavigate,
}) => {
  const router = useRouter();
  const products = useSelector((state) => state.product.list);
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const suggestions = getProductSuggestions(products, search, 6);
  const trimmedSearch = search.trim();

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  const closeSearch = () => {
    setIsOpen(false);
    onNavigate?.();
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!trimmedSearch) {
      return;
    }

    closeSearch();
    router.push(`/shop?search=${encodeURIComponent(trimmedSearch)}`);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form
        onSubmit={handleSubmit}
        className={`flex items-center text-sm gap-2 bg-slate-100 px-4 py-3 rounded-full ${isMobile ? "w-full" : ""}`}
      >
        <Search size={18} className="text-slate-600 shrink-0" />
        <input
          className={`w-full bg-transparent outline-none placeholder-slate-600 ${inputClassName}`}
          type="text"
          placeholder="Search products"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          autoFocus={isMobile}
          autoComplete="off"
        />
      </form>

      {isOpen && trimmedSearch && (
        <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          {suggestions.length > 0 ? (
            <>
              <div className="max-h-[360px] overflow-y-auto py-2">
                {suggestions.map((product) => (
                  <Link
                    key={product.id}
                    href={`/product/${product.id}`}
                    onClick={closeSearch}
                    className="flex items-center gap-3 px-3 py-2.5 transition hover:bg-slate-50"
                  >
                    <div className="relative h-14 w-14 overflow-hidden rounded-xl bg-slate-100">
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {product.name}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {product.category}
                        {product.store?.name ? ` - ${product.store.name}` : ""}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-slate-900">
                      {currency}
                      {Number(product.price).toLocaleString()}
                    </p>
                  </Link>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  closeSearch();
                  router.push(`/shop?search=${encodeURIComponent(trimmedSearch)}`);
                }}
                className="flex w-full items-center justify-between border-t border-slate-100 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <span>See all results for "{trimmedSearch}"</span>
                <ArrowUpRight size={16} />
              </button>
            </>
          ) : (
            <div className="px-4 py-4 text-sm text-slate-500">
              No quick suggestions yet. Press Enter to search all products.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchAutocomplete;
