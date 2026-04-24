import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEOHead from "@/components/SEOHead";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <>
      <SEOHead
        title="Page Not Found | GOPARTARA"
        description="The page you're looking for doesn't exist. Head back to GOPARTARA to find any car part instantly."
        path={location.pathname}
      />
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <div className="text-center max-w-md animate-fade-in">
          {/* Logo */}
          <Link to="/" className="inline-block mb-8">
            <span className="font-display text-2xl font-black tracking-tight">
              <span className="text-primary">PART</span>ARA
            </span>
          </Link>

          {/* Big 404 */}
          <div className="relative mb-8">
            <span className="text-[140px] sm:text-[180px] font-display font-black leading-none text-primary/10 select-none">
              404
            </span>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-5xl sm:text-6xl font-display font-black text-primary">
                404
              </span>
            </div>
          </div>

          <h1 className="font-display text-2xl font-bold mb-3 text-foreground">
            Page not found
          </h1>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            This page doesn't exist or has been moved.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="rounded-xl gap-2 w-full sm:w-auto">
              <Link to="/">
                <Home size={16} /> Go to Homepage
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-xl gap-2 w-full sm:w-auto">
              <Link to="/search">
                <Search size={16} /> Search for parts →
              </Link>
            </Button>
          </div>

          <button
            onClick={() => window.history.back()}
            className="mt-6 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 mx-auto"
          >
            <ArrowLeft size={14} /> Go back
          </button>
        </div>

        <div className="absolute bottom-8">
          <span className="font-display text-xs font-bold tracking-[4px] text-muted-foreground/40 uppercase">
            GOPARTARA
          </span>
        </div>
      </div>
    </>
  );
};

export default NotFound;
