const ShortenForm = ({
  cached,
}: {
  cached: string,
}) => (
  <form method="GET">
    <div className="relative w-[min(60ch,100%)]">
      <label htmlFor="UserEmail" className="sr-only">
        Paste your URL here!
      </label>
      <input
        type="text"
        id="url"
        name="url"
        required={true}
        placeholder="Paste here!"
        defaultValue={cached || ""}
        className="w-full rounded-md border border-neutral-200 px-4 py-2 pe-10 shadow-sm sm:text-sm"
      />
      <span className="pointer-events-none absolute inset-y-0 end-0 grid w-10 place-content-center text-gray-500">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="size-4" viewBox="0 0 16 16">
          <path d="M4.715 6.542 3.343 7.914a3 3 0 1 0 4.243 4.243l1.828-1.829A3 3 0 0 0 8.586 5.5L8 6.086a1 1 0 0 0-.154.199 2 2 0 0 1 .861 3.337L6.88 11.45a2 2 0 1 1-2.83-2.83l.793-.792a4 4 0 0 1-.128-1.287z" />
          <path d="M6.586 4.672A3 3 0 0 0 7.414 9.5l.775-.776a2 2 0 0 1-.896-3.346L9.12 3.55a2 2 0 1 1 2.83 2.83l-.793.792c.112.42.155.855.128 1.287l1.372-1.372a3 3 0 1 0-4.243-4.243z" />
        </svg>
      </span>
    </div>
    <button type="submit" className="px-3 sm:px-5 text-sm h-9 cursor-pointer focus:outline-none bg-neutral-900 hover:bg-neutral-800 rounded-md items-center text-gray-100 hover:text-white font-sans font-bold mt-3">
      Short! &#10024;
    </button>
  </form>
);

export default ShortenForm;
