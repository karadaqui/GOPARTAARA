import { Badge } from "@/components/ui/badge";

const CATEGORY_TAGS = [
  "Engine Parts", "Body Parts", "Brakes", "Suspension", "Electrical",
  "Filters", "Exhaust", "Interior", "Cooling", "Transmission"
];

interface Props {
  selected: string[];
  onChange: (tags: string[]) => void;
}

const CategoryTagSelector = ({ selected, onChange }: Props) => {
  const toggle = (tag: string) => {
    if (selected.includes(tag)) {
      onChange(selected.filter(t => t !== tag));
    } else {
      onChange([...selected, tag]);
    }
  };

  return (
    <div>
      <label className="text-sm text-muted-foreground block mb-2">Category Tags</label>
      <div className="flex flex-wrap gap-1.5">
        {CATEGORY_TAGS.map(tag => (
          <button
            key={tag}
            type="button"
            onClick={() => toggle(tag)}
          >
            <Badge
              variant={selected.includes(tag) ? "default" : "outline"}
              className="cursor-pointer text-xs transition-colors"
            >
              {tag}
            </Badge>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryTagSelector;
