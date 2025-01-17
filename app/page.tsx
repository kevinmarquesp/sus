import Result from "@/components/result";
import ShortenForm from "@/components/shorten-form";
import { db } from "@/db/db";
import { ShortenService } from "@/services/shorten-service";
import { headers } from "next/headers";

const shortenProcess = async (url: string) => {
  try {
    const service = new ShortenService(db, { target: url });

    return await service.run();

  } catch (err) {
    console.log("Unexpected error:", err);

    return {
      error: "An unexpected error occured",
    };
  }
};

const Home = async ({
  searchParams,
}: {
  searchParams: Promise<{
    url?: string,
    cached?: string,
  }>,
}) => {
  const origin = (await headers()).get("x-url") + "/" || "/";
  const { url, cached } = await searchParams;
  const result = url ? await shortenProcess(url) : null;

  return (
    <div className="h-full grid place-items-center">
      <div className="w-full p-6">
        <header>
          <h1 className="text-2xl font-extrabold sm:text-3xl lg:text-4xl font-sans">
            Secure URL Shortner
          </h1>
          <p className="text-sm sm:text-lg mt-3 sm:mt-7 text-neutral-500">
            An URL shortner that doesn&apos;t track anything, just paste your long URL down below, copy the generated shorten link and be happy!
          </p>
        </header>
        <section className="mt-12 w-full">
          {result && "error" in result ? (
            <>
              <p className="text-red-600 bg-red-100 border border-red-300 px-4 py-2 rounded-md text-sm">
                <span className="font-bold">Error:</span> {result.error}; try comming back later...
              </p>
            </>
          ) : result ? (
            <>
              <Result result={origin + result.id} url={result.target} />
            </>
          ) : (
            <>
              <ShortenForm cached={cached ? decodeURIComponent(cached) : ""} />
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default Home;
