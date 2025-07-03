import { useCallback } from "react";
import { toast } from "sonner";

interface ExampleResponse {
  message: string;
  example: Array<{
    id: string;
    name_en: string;
    name_de: string;
    filename: string;
  }>;
  required_fields: Record<string, string>;
  image_locations: Record<string, string>;
}

export function useExampleDownload() {
  const downloadExample = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/items/import");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as ExampleResponse;

      // Create the example ZIP structure
      const exampleStructure = {
        "items.json": data.example,
        "README.txt": `ZIP Structure:
/items.json - Contains the item metadata
/images/default/ - Default texture images (PNG format)
/images/sphax/ - Optional Sphax texture images (PNG format)

If sphax images are not provided, default images will be copied automatically.

Image naming convention: namespace__item.png
Example: minecraft__stone.png`,
      };

      const blob = new Blob([JSON.stringify(exampleStructure, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "minecraft-items-structure-example.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Example structure downloaded!");
    } catch (error: unknown) {
      console.error("Download error:", error);
      toast.error("Failed to download example file");
    }
  }, []);

  return {
    downloadExample,
  };
}
