import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Bookmark,
  ExternalLink,
  Trash2,
  Loader2,
  Package,
  Search,
} from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

const SavedParts = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [parts, setParts] = useState<Tables<"saved_parts">[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) fetchParts();
  }, [user]);

  const fetchParts = async () => {
    const { data, error } = await supabase
      .from("saved_parts")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });

    if (!error && data) setParts(data);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setConfirmDeleteId(null);
    const { error } = await supabase.from("saved_parts").delete().eq("id", id);
    setDeletingId(null);
    if (error) {
      toast.error("Failed to remove part", { description: error.message });
    } else {
      setParts((prev) => prev.filter((p) => p.id !== id));
      toast.success("Part removed from saved list");
    }
  };

  const handleClearAll = async () => {
    setConfirmClearAll(false);
    const { error } = await supabase
      .from("saved_parts")
      .delete()
      .eq("user_id", user!.id);
    if (error) {
      toast.error("Failed to clear saved parts", { description: error.message });
    } else {
      setParts([]);
      toast.success("All saved parts removed");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="container max-w-5xl flex-1 px-4 py-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold">Saved Parts</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {parts.length} {parts.length === 1 ? "part" : "parts"} saved
            </p>
          </div>
          {parts.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl gap-2 text-destructive hover:text-destructive"
              onClick={() => setConfirmClearAll(true)}
            >
              <Trash2 size={14} />
              <span className="hidden sm:inline">Clear All</span>
            </Button>
          )}
        </div>

        {parts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Bookmark size={48} className="text-muted-foreground/20 mb-4" />
            <h2 className="font-display text-xl font-semibold mb-2">No saved parts yet</h2>
            <p className="text-sm text-muted-foreground max-w-md mb-6">
              When you find a part you like, click the bookmark icon to save it here. We'll track the price for you.
            </p>
            <Button className="rounded-xl gap-2" onClick={() => navigate("/search")}>
              <Search size={16} />
              Start Searching
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {parts.map((part) => (
              <div
                key={part.id}
                className="glass rounded-2xl p-3 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start gap-3 sm:gap-5 w-full sm:w-auto sm:flex-1 min-w-0">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-secondary/50 flex items-center justify-center shrink-0">
                    {part.image_url && part.image_url !== "/placeholder.svg" ? (
                      <img
                        src={part.image_url}
                        alt={part.part_name}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <Package size={20} className="sm:w-6 sm:h-6 text-muted-foreground/30" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-semibold text-sm leading-snug line-clamp-2">
                      {part.part_name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                      {part.supplier && <span className="truncate max-w-[120px]">{part.supplier}</span>}
                      {part.part_number && <span>#{part.part_number}</span>}
                    </div>
                    {part.price != null && (
                      <p className="font-display text-base sm:text-lg font-bold mt-1 sm:hidden">
                        £{Number(part.price).toFixed(2)}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Saved {new Date(part.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                {part.price != null && (
                  <span className="hidden sm:block font-display text-lg font-bold shrink-0">
                    £{Number(part.price).toFixed(2)}
                  </span>
                )}

                <div className="flex gap-2 sm:shrink-0">
                  {part.url && part.url !== "#" && (
                    <Button size="sm" className="rounded-xl h-9 gap-1.5 text-xs flex-1 sm:flex-none" asChild>
                      <a href={part.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink size={13} />
                        View
                      </a>
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl h-9 w-9 p-0 text-muted-foreground hover:text-destructive hover:border-destructive shrink-0"
                    onClick={() => setConfirmDeleteId(part.id)}
                    disabled={deletingId === part.id}
                  >
                    {deletingId === part.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete single part confirmation */}
      <AlertDialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this part from saved?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear all confirmation */}
      <AlertDialog open={confirmClearAll} onOpenChange={setConfirmClearAll}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all saved parts?</AlertDialogTitle>
            <AlertDialogDescription>This will remove all {parts.length} saved parts. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleClearAll}
            >
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
};

export default SavedParts;