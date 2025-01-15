const RootTemplate = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>) => (
  <div id="root">
    {children}
  </div>
);

export default RootTemplate;
