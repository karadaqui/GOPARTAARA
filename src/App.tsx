import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Suspense, lazy } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { SearchLimitProvider } from "@/contexts/SearchLimitContext";
import { CountryProvider } from "@/contexts/CountryContext";
import { LocaleProvider } from "@/contexts/LocaleContext";
import PageLoader from "@/components/PageLoader";
import CookieConsent from "./components/CookieConsent.tsx";
import PWAInstallPrompt from "./components/PWAInstallPrompt.tsx";
import DevToolsGuard from "./components/DevToolsGuard.tsx";
import ScrollToTop from "./components/ScrollToTop.tsx";
import TopProgressBar from "./components/TopProgressBar.tsx";
import MobileAppBanner from "./components/MobileAppBanner.tsx";
import MotTaxReminderRunner from "./components/garage/MotTaxReminderRunner.tsx";

import ErrorBoundary from "./components/ErrorBoundary.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";

// Lazy load all routes (including home) for the smallest initial bundle
const Index = lazy(() => import("./pages/Index.tsx"));

// Lazy load other routes
const Auth = lazy(() => import("./pages/Auth.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.tsx"));
const SearchResults = lazy(() => import("./pages/SearchResults.tsx"));
const SavedParts = lazy(() => import("./pages/SavedParts.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const About = lazy(() => import("./pages/About.tsx"));
const Contact = lazy(() => import("./pages/Contact.tsx"));
const Privacy = lazy(() => import("./pages/Privacy.tsx"));
const Terms = lazy(() => import("./pages/Terms.tsx"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe.tsx"));
const Blog = lazy(() => import("./pages/Blog.tsx"));
const BlogPostPage = lazy(() => import("./pages/BlogPost.tsx"));
const ListYourParts = lazy(() => import("./pages/ListYourParts.tsx"));
const MyMarket = lazy(() => import("./pages/MyMarket.tsx"));
const Marketplace = lazy(() => import("./pages/Marketplace.tsx"));
const ListingDetail = lazy(() => import("./pages/ListingDetail.tsx"));
const SellerProfile = lazy(() => import("./pages/SellerProfile.tsx"));
const Pricing = lazy(() => import("./pages/Pricing.tsx"));
const Admin = lazy(() => import("./pages/Admin.tsx"));
const Garage = lazy(() => import("./pages/Garage.tsx"));
const Refund = lazy(() => import("./pages/Refund.tsx"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail.tsx"));
const SubscriptionPolicy = lazy(() => import("./pages/SubscriptionPolicy.tsx"));
const CompleteProfile = lazy(() => import("./pages/CompleteProfile.tsx"));
const Messages = lazy(() => import("./pages/Messages.tsx"));
const ConfirmShopDelete = lazy(() => import("./pages/ConfirmShopDelete.tsx"));
const RecentParts = lazy(() => import("./pages/RecentParts.tsx"));
const Tyres = lazy(() => import("./pages/Tyres.tsx"));
const Deals = lazy(() => import("./pages/Deals.tsx"));
const AffiliateDisclosure = lazy(() => import("./pages/AffiliateDisclosure.tsx"));
const Business = lazy(() => import("./pages/Business.tsx"));
const Compare = lazy(() => import("./pages/Compare.tsx"));
const Help = lazy(() => import("./pages/Help.tsx"));
const Cookies = lazy(() => import("./pages/Cookies.tsx"));
const Alerts = lazy(() => import("./pages/Alerts.tsx"));

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <SubscriptionProvider>
            <SearchLimitProvider>
            <CountryProvider>
            <LocaleProvider>
            <ScrollToTop />
            <TopProgressBar />
            <MotTaxReminderRunner />
            <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <MobileAppBanner />
              <div className="pb-20 md:pb-0 overflow-x-hidden w-full max-w-[100vw]">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/search" element={<SearchResults />} />
                <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
                <Route path="/saved" element={<ProtectedRoute><SavedParts /></ProtectedRoute>} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/unsubscribe" element={<Unsubscribe />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPostPage />} />
                <Route path="/list-your-parts" element={<ListYourParts />} />
                <Route path="/my-market" element={<ProtectedRoute><MyMarket /></ProtectedRoute>} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/listing/:id" element={<ListingDetail />} />
                <Route path="/marketplace/:id" element={<ListingDetail />} />
                <Route path="/seller/:id" element={<SellerProfile />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/garage" element={<ProtectedRoute><Garage /></ProtectedRoute>} />
                <Route path="/refund" element={<Refund />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/subscription-policy" element={<SubscriptionPolicy />} />
                <Route path="/complete-profile" element={<ProtectedRoute><CompleteProfile /></ProtectedRoute>} />
                <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
                <Route path="/confirm-shop-delete/:token" element={<ConfirmShopDelete />} />
                <Route path="/recent" element={<RecentParts />} />
                <Route path="/tyres" element={<Tyres />} />
                <Route path="/deals" element={<Deals />} />
                <Route path="/affiliate-disclosure" element={<AffiliateDisclosure />} />
                <Route path="/business" element={<Business />} />
                <Route path="/compare" element={<Compare />} />
                <Route path="/help" element={<Help />} />
                <Route path="/cookies" element={<Cookies />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              </div>
            </Suspense>
            </ErrorBoundary>
            <CookieConsent />
            <PWAInstallPrompt />
            <DevToolsGuard />
            
            </LocaleProvider>
            </CountryProvider>
            </SearchLimitProvider>
            </SubscriptionProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
