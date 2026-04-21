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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  ExternalLink,
  Trash2,
  Loader2,
  Package,
  Search,
  FolderPlus,
  FolderInput,
  X,
} from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type SavedPart = Tables<"saved_parts">;

interface Folder {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

const SavedParts = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [parts, setParts] = useState<SavedPart[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [movePartId, setMovePartId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteFolderId, setDeleteFolderId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) fetchAll();
  }, [user]);

  const fetchAll = async () => {
    const [partsRes, foldersRes] = await Promise.all([
      supabase.from("saved_parts").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
      supabase.from("saved_folders").select("*").eq("user_id", user!.id).order("created_at", { ascending: true }),
    ]);
    if (partsRes.data) setParts(partsRes.data);
    if (foldersRes.data) setFolders(foldersRes.data as Folder[]);
    setLoading(false);
  };

  const filteredParts = activeFolder
    ? parts.filter((p) => (p as any).folder_id === activeFolder)
    : parts;

  const totalValue = parts.reduce((sum, p) => sum + (Number(p.price) || 0), 0);

  const folderPartCount = (folderId: string) => parts.filter((p) => (p as any).folder_id === folderId).length;
  const folderValue = (folderId: string) =>
    parts.filter((p) => (p as any).folder_id === folderId).reduce((s, p) => s + (Number(p.price) || 0), 0);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setConfirmDeleteId(null);
    const { error } = await supabase.from("saved_parts").delete().eq("id", id);
    setDeletingId(null);
    if (error) {
      toast.error("Failed to remove part");
    } else {
      setParts((prev) => prev.filter((p) => p.id !== id));
      toast.success("Part removed");
    }
  };

  const handleClearAll = async () => {
    setConfirmClearAll(false);
    const { error } = await supabase.from("saved_parts").delete().eq("user_id", user!.id);
    if (!error) { setParts([]); toast.success("All saved parts removed"); }
    else toast.error("Failed to clear saved parts");
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    setCreatingFolder(true);
    const { data, error } = await supabase.from("saved_folders").insert({
      user_id: user!.id,
      name: newFolderName.trim(),
    }).select().single();
    setCreatingFolder(false);
    if (!error && data) {
      setFolders((prev) => [...prev, data as Folder]);
      setNewFolderName("");
      setShowNewFolder(false);
      toast.success("Folder created");
    } else toast.error("Failed to create folder");
  };

  const deleteFolder = async (id: string) => {
    setDeleteFolderId(null);
    const { error } = await supabase.from("saved_folders").delete().eq("id", id);
    if (!error) {
      setFolders((prev) => prev.filter((f) => f.id !== id));
      // Parts with this folder_id will have it set to null by ON DELETE SET NULL
      setParts((prev) => prev.map((p) => (p as any).folder_id === id ? { ...p, folder_id: null } as any : p));
      if (activeFolder === id) setActiveFolder(null);
      toast.success("Folder deleted");
    } else toast.error("Failed to delete folder");
  };

  const movePart = async (partId: string, folderId: string | null) => {
    const { error } = await supabase.from("saved_parts").update({ folder_id: folderId } as any).eq("id", partId);
    if (!error) {
      setParts((prev) => prev.map((p) => p.id === partId ? { ...p, folder_id: folderId } as any : p));
      setMovePartId(null);
      toast.success("Part moved");
    } else toast.error("Failed to move part");
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

      <div className="container max-w-6xl flex-1 px-4 py-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-[11px] font-semibold tracking-widest uppercase text-destructive/60 mb-1">
              YOUR COLLECTION
            </p>
            <h1 className="text-2xl font-bold text-foreground">
              Saved Parts
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {parts.length} parts
              </span>
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowNewFolder(true)}
              className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground transition-all"
            >
              <FolderPlus size={16} /> New Folder
            </button>
            {parts.length > 0 && (
              <button
                onClick={() => setConfirmClearAll(true)}
                className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:border-destructive/30 hover:text-destructive transition-all"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Folders */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8">
          {/* All Parts */}
          <button
            onClick={() => setActiveFolder(null)}
            className={`p-4 rounded-xl border text-left transition-all ${
              activeFolder === null
                ? "border-destructive/50 bg-destructive/5"
                : "border-border bg-secondary/50 hover:border-muted-foreground/30"
            }`}
          >
            <div className="text-2xl mb-2">📦</div>
            <p className="font-semibold text-foreground text-sm">All Parts</p>
            <p className="text-xs text-muted-foreground mt-0.5">{parts.length} parts</p>
            <p className="text-xs text-emerald-400 mt-1">£{totalValue.toFixed(2)} total</p>
          </button>

          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => setActiveFolder(folder.id)}
              className={`p-4 rounded-xl border text-left transition-all relative group ${
                activeFolder === folder.id
                  ? "border-destructive/50 bg-destructive/5"
                  : "border-border bg-secondary/50 hover:border-muted-foreground/30"
              }`}
            >
              <div className="text-2xl mb-2">📁</div>
              <p className="font-semibold text-foreground text-sm truncate">{folder.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{folderPartCount(folder.id)} parts</p>
              <p className="text-xs text-emerald-400 mt-1">£{folderValue(folder.id).toFixed(2)}</p>
              <button
                onClick={(e) => { e.stopPropagation(); setDeleteFolderId(folder.id); }}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
              >
                <X size={14} />
              </button>
            </button>
          ))}

          {/* Inline new folder */}
          <button
            onClick={() => setShowNewFolder(true)}
            className="p-4 rounded-xl border border-dashed border-border hover:border-muted-foreground/40 text-left transition-all"
          >
            <div className="text-2xl mb-2">➕</div>
            <p className="text-sm text-muted-foreground">New folder</p>
          </button>
        </div>

        {/* Parts grid */}
        {filteredParts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">🔖</p>
            <p className="text-muted-foreground font-medium">
              {activeFolder ? "No parts in this folder" : "No saved parts yet"}
            </p>
            <p className="text-muted-foreground/60 text-sm mt-1">
              Save parts from search results to find them quickly later
            </p>
            {!activeFolder && (
              <button
                onClick={() => navigate("/search")}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground text-sm rounded-lg hover:bg-destructive/90 transition-colors"
              >
                <Search size={14} /> Start Searching
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredParts.map((part) => (
              <div
                key={part.id}
                className="group bg-secondary/50 border border-border/50 rounded-xl overflow-hidden hover:border-muted-foreground/30 transition-all"
              >
                {/* Image */}
                <div className="aspect-square bg-background overflow-hidden relative">
                  {part.image_url && part.image_url !== "/placeholder.svg" ? (
                    <img
                      src={part.image_url}
                      alt={part.part_name}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
                      className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                      <Package size={32} />
                    </div>
                  )}
                  <button
                    onClick={() => setMovePartId(part.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-background/60 backdrop-blur-sm p-1.5 rounded-lg transition-all"
                  >
                    <FolderInput size={12} className="text-muted-foreground" />
                  </button>
                </div>

                {/* Info */}
                <div className="p-2.5">
                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-snug mb-2 group-hover:text-foreground transition-colors">
                    {part.part_name}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-foreground">
                      £{Number(part.price || 0).toFixed(2)}
                    </p>
                    <div className="flex gap-1">
                      {part.url && part.url !== "#" && (
                        <a
                          href={part.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg border border-border hover:border-muted-foreground/40 text-muted-foreground hover:text-foreground transition-all"
                        >
                          <ExternalLink size={11} />
                        </a>
                      )}
                      <button
                        onClick={() => setConfirmDeleteId(part.id)}
                        disabled={deletingId === part.id}
                        className="p-1.5 rounded-lg border border-border hover:border-destructive/30 text-muted-foreground hover:text-destructive transition-all"
                      >
                        {deletingId === part.id ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Folder Modal */}
      <Dialog open={showNewFolder} onOpenChange={setShowNewFolder}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Folder</DialogTitle>
            <DialogDescription>Organise your saved parts into folders</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Input
              placeholder="Folder name (e.g. BMW E46 Parts)"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createFolder()}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewFolder(false)}>Cancel</Button>
              <Button
                onClick={createFolder}
                disabled={!newFolderName.trim() || creatingFolder}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {creatingFolder ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Move to Folder Modal */}
      <Dialog open={!!movePartId} onOpenChange={(open) => !open && setMovePartId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Move to folder</DialogTitle>
            <DialogDescription>Choose a folder for this part</DialogDescription>
          </DialogHeader>
          <div className="space-y-1 pt-2">
            <button
              onClick={() => movePartId && movePart(movePartId, null)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all ${
                !(parts.find((p) => p.id === movePartId) as any)?.folder_id
                  ? "bg-destructive/10 text-foreground border border-destructive/30"
                  : "text-muted-foreground hover:bg-secondary border border-transparent"
              }`}
            >
              📦 All Parts (no folder)
            </button>
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => movePartId && movePart(movePartId, folder.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all ${
                  (parts.find((p) => p.id === movePartId) as any)?.folder_id === folder.id
                    ? "bg-destructive/10 text-foreground border border-destructive/30"
                    : "text-muted-foreground hover:bg-secondary border border-transparent"
                }`}
              >
                📁 {folder.name}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete part confirmation */}
      <AlertDialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this part?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete folder confirmation */}
      <AlertDialog open={!!deleteFolderId} onOpenChange={(open) => !open && setDeleteFolderId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this folder?</AlertDialogTitle>
            <AlertDialogDescription>Parts in this folder will be moved to "All Parts".</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteFolderId && deleteFolder(deleteFolderId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear all confirmation */}
      <AlertDialog open={confirmClearAll} onOpenChange={setConfirmClearAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all saved parts?</AlertDialogTitle>
            <AlertDialogDescription>This will remove all {parts.length} saved parts. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
