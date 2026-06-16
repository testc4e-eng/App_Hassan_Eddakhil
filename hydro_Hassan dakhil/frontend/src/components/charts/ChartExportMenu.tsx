import { Download, Image as ImageIcon, FileDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

type Props = {
  onExportCsv: () => void | Promise<void>;
  onExportPng: () => void | Promise<void>;
  csvDisabled?: boolean;
  pngDisabled?: boolean;
  label?: string;
};

export function ChartExportMenu({
  onExportCsv,
  onExportPng,
  csvDisabled = false,
  pngDisabled = false,
  label = "Export",
}: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <Download className="mr-2 h-4 w-4" />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>Exporter le graphique</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={csvDisabled} onClick={() => void onExportCsv()}>
          <FileDown className="mr-2 h-4 w-4" />
          CSV
        </DropdownMenuItem>
        <DropdownMenuItem disabled={pngDisabled} onClick={() => void onExportPng()}>
          <ImageIcon className="mr-2 h-4 w-4" />
          PNG
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
