import { useState } from "react";
import { X, Scale, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export interface ComparePart {
  name: string;
  supplier: string;
  tier: string;
  url: string;
}

interface Props {
  parts: ComparePart[];
  onRemove: (index: number) => void;
  onClose: () => void;
}

// Generate mock data deterministically
const mockData = (part: ComparePart) => {
  const seed = (part.name + part.supplier).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const price = (20 + (seed % 180)).toFixed(2);
  const shipping = seed % 3 === 0 ? "Free" : `£${(2.99 + (seed % 5)).toFixed(2)}`;
  const availability = seed % 4 === 0 ? "Out of Stock" : seed % 3 === 0 ? "2-3 days" : "In Stock";
  return { price: `£${price}`, shipping, availability };
};

const PartsComparison = ({ parts, onRemove, onClose }: Props) => {
  if (parts.length < 2) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass rounded-2xl p-6 max-w-3xl w-full max-h-[80vh] overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold flex items-center gap-2">
            <Scale size={20} className="text-primary" />
            Compare Parts
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Feature</TableHead>
                {parts.map((p, i) => (
                  <TableHead key={i}>
                    <div className="flex items-center justify-between">
                      <span className="truncate">{p.supplier}</span>
                      <button onClick={() => onRemove(i)} className="text-muted-foreground hover:text-destructive ml-2">
                        <X size={14} />
                      </button>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Price</TableCell>
                {parts.map((p, i) => (
                  <TableCell key={i} className="font-bold text-primary">{mockData(p).price}</TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Shipping</TableCell>
                {parts.map((p, i) => (
                  <TableCell key={i}>{mockData(p).shipping}</TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Availability</TableCell>
                {parts.map((p, i) => {
                  const avail = mockData(p).availability;
                  return (
                    <TableCell key={i} className={avail === "In Stock" ? "text-green-500" : avail === "Out of Stock" ? "text-destructive" : "text-amber-400"}>
                      {avail}
                    </TableCell>
                  );
                })}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Quality</TableCell>
                {parts.map((p, i) => (
                  <TableCell key={i}>
                    <span className="inline-flex items-center gap-1 text-xs font-bold uppercase">
                      <Shield size={10} />
                      {p.tier}
                    </span>
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Link</TableCell>
                {parts.map((p, i) => (
                  <TableCell key={i}>
                    <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                      Visit →
                    </a>
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default PartsComparison;
