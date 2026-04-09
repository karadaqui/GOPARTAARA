import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  CheckCircle, XCircle, Loader2, Shield, Package, Eye, Store
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const ADMIN_EMAIL = "info@gopartara.com";

interface PendingListing {
  id: string;
  title: string;
  description: string;
  price: number | null;
  category: string | null;
  photos: string[];
  created_at: string;
  approval_status: string;
  seller_profiles: {
    id: string;
    business_name: string;
    contact_email: string | null;
    seller_tier: string;
  };
}

const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [listings, setListings] = useState<PendingListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");

  useEffect(() => {
    if (!user) { navigate("/auth?redirect=/admin"); return; }
    // Allow access by admin email or admin subscription plan
    const checkAccess = async () => {
      const { data: adminProfile } = await supabase
        .from("profiles")
        .select("subscription_plan")
        .eq("user_id", user.id)
        .single();
      const isAdmin = user.email === ADMIN_EMAIL || adminProfile?.subscription_plan === "admin";
      if (!isAdmin) {
        toast({ title: "Access denied", variant: "destructive" });
        navigate("/");
        return;
      }
      loadListings();
    };
    checkAccess();
  }, [user]);

  const loadListings = async () => {
    setLoading(true);
    const query = supabase
      .from("seller_listings")
      .select("*, seller_profiles(id, business_name, contact_email, seller_tier)")
      .order("created_at", { ascending: false });

    const { data } = await query;
    setListings((data as unknown as PendingListing[]) || []);
    setLoading(false);
  };

  const handleApprove = async (id: string) => {
    setProcessing(id);
    const listing = listings.find(l => l.id === id);
    
    // Approve the listing
    const { error } = await supabase
      .from("seller_listings")
      .update({ approval_status: "approved" } as any)
      .eq("id", id);

    // Also approve the seller profile if not yet approved
    if (!error && listing?.seller_profiles?.id) {
      await supabase
        .from("seller_profiles")
        .update({ approved: true } as any)
        .eq("id", listing.seller_profiles.id);
    }

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Listing & seller approved!" });
      await loadListings();
    }
    setProcessing(null);
  };

  const handleReject = async (id: string) => {
    setProcessing(id);
    const { error } = await supabase
      .from("seller_listings")
      .update({ approval_status: "rejected" } as any)
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Listing rejected" });
      await loadListings();
    }
    setProcessing(null);
  };

  const filtered = listings.filter(l => filter === "all" || l.approval_status === filter);

  if (!user || user.email !== ADMIN_EMAIL) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-5xl py-20 px-4">
        <div className="flex items-center gap-3 mb-8">
          <Shield size={28} className="text-primary" />
          <h1 className="font-display text-3xl font-bold">Admin Panel</h1>
        </div>

        <div className="flex gap-2 mb-6">
          {(["pending", "approved", "rejected", "all"] as const).map(f => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "outline"}
              onClick={() => setFilter(f)}
              className="rounded-full capitalize"
            >
              {f}
              {f !== "all" && (
                <span className="ml-1.5 text-xs">
                  ({listings.filter(l => l.approval_status === f).length})
                </span>
              )}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <Package size={48} className="text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display text-lg font-bold mb-2">No {filter} listings</h3>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(listing => (
              <div key={listing.id} className="glass rounded-xl p-4 flex gap-4">
                {listing.photos[0] ? (
                  <img src={listing.photos[0]} alt="" className="w-24 h-24 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-24 h-24 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <Package size={24} className="text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-display font-bold line-clamp-1">{listing.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Store size={12} className="text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {listing.seller_profiles?.business_name} · {listing.seller_profiles?.seller_tier}
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant={
                        listing.approval_status === "approved" ? "default" :
                        listing.approval_status === "rejected" ? "destructive" : "secondary"
                      }
                      className="capitalize shrink-0"
                    >
                      {listing.approval_status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{listing.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {listing.price && <span className="text-primary font-bold text-sm">£{listing.price.toFixed(2)}</span>}
                    {listing.category && <Badge variant="outline" className="text-xs">{listing.category}</Badge>}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {new Date(listing.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {listing.approval_status === "pending" && (
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(listing.id)}
                        disabled={processing === listing.id}
                        className="rounded-xl gap-1.5"
                      >
                        {processing === listing.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(listing.id)}
                        disabled={processing === listing.id}
                        className="rounded-xl gap-1.5"
                      >
                        <XCircle size={14} /> Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/listing/${listing.id}`)}
                        className="rounded-xl gap-1.5"
                      >
                        <Eye size={14} /> Preview
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Admin;
