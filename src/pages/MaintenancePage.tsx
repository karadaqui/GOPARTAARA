import { Link } from "react-router-dom";

const MaintenancePage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">
          <span style={{ color: "#cc1111" }}>GOPARTARA</span>
        </h1>
        <div className="text-2xl font-semibold text-foreground">
          🔧 This page is under maintenance
        </div>
        <p className="text-muted-foreground">
          We're making improvements — check back soon!
        </p>
        <div className="pt-2">
          <Link
            to="/"
            className="inline-block btn-navy px-5 py-2 rounded-md font-medium"
          >
            ← Back to Search
          </Link>
        </div>
        <p className="text-sm text-muted-foreground pt-2">
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

const PREVIEW_KEY = "preview=gp#9x2k";

export const withMaintenance = (Component: React.ComponentType) => {
  const Wrapped = () => {
    if (
      typeof window !== "undefined" &&
      window.location.search.includes(PREVIEW_KEY)
    ) {
      return <Component />;
    }
    return <MaintenancePage />;
  };
  return Wrapped;
};

export default MaintenancePage;
