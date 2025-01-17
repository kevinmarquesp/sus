"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";

const Result = ({
  result,
  url,
}: {
  result: string,
  url: string,
}) => {
  const [isCopyAnimationActive, setIsCopyAnimationActive] = useState<boolean>(false);

  const copyHandler = () => {
    navigator.clipboard.writeText(result);

    setIsCopyAnimationActive(true);

    setTimeout(() => {
      setIsCopyAnimationActive(false);
    }, 1600);
  };

  return (
    <div className="relative w-[min(60ch,100%)]">
      <span className={cn(
        "absolute bottom-full bg-neutral-200 px-2 py-1 rounded-md border border-neutral-300 mb-2.5 z-10 transition-all ease-linear duration-75", isCopyAnimationActive ? "" : "translate-y-2/3 opacity-0",
      )}>
        Copied
      </span>
      <a href={result} className="w-full rounded-md border border-neutral-200 px-4 py-2 block shadow-sm sm:text-sm font-mono underline hover:underline-offset-4 text-sky-700 hover:text-sky-600 bg-neutral-100">
        {result}
      </a>
      <div className="mt-3 flex gap-6 items-center">
        <button onClick={copyHandler} className="px-3 sm:px-5 text-sm h-9 cursor-pointer focus:outline-none bg-neutral-900 hover:bg-neutral-800 rounded-md items-center text-gray-100 hover:text-white font-sans font-bold flex gap-2">
          <span>
            Copy
          </span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="size-4" viewBox="0 0 16 16">
            <path fillRule="evenodd" d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1z" />
          </svg>
        </button>
        <Link href={"/?cached=" + encodeURIComponent(url)} className="underline hover:underline-offset-4">
          &#8617; Back
        </Link>
      </div>
    </div>
  );
};

export default Result;
