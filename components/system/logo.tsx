import { FileTextIcon } from "lucide-react";

export default function Logo() {
  return (
    <div className="flex items-center gap-2 bg-linear-to-r from-secondary via-secondary/50 to-transparent rounded-2xl p-4">
      <FileTextIcon />
      <span className="text-xl font-medium text-muted-foreground">Docs Generator</span>
    </div>
  );
}
