const Maintenance = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-5xl font-bold tracking-tight">
          <span style={{ color: "#cc1111" }}>GOPARTARA</span>
        </h1>
        <h2 className="text-2xl font-semibold text-foreground">
          We're upgrading our systems
        </h2>
        <p className="text-lg text-muted-foreground">
          Back soon — better than ever 🚀
        </p>
        <p className="text-sm text-muted-foreground pt-4">
          Need help?{" "}
          <a
            href="mailto:info@gopartara.com"
            className="text-foreground font-medium underline"
          >
            info@gopartara.com
          </a>
        </p>
      </div>
    </div>
  );
};

export default Maintenance;
