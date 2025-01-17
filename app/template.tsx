const RootTemplate = async ({
  children,
}: Readonly<{
  children: React.ReactNode
}>) => (
  <div id="root" className="h-screen w-screen flex flex-col">
    <main className="grow w-full max-w-3xl mx-auto">
      {children}
    </main>
    <footer className="w-full max-w-3xl mx-auto text-start">
      {/*
        TODO: Add the source code link and the group creation page url here.
      */}
    </footer>
  </div>
);

export default RootTemplate;
