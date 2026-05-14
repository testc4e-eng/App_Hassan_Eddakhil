import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const lang = i18n.language?.startsWith("en") ? "en" : "fr";

  const changeLanguage = (next: "fr" | "en") => {
    void i18n.changeLanguage(next);
    if (typeof window !== "undefined") localStorage.setItem("lang", next);
  };

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border p-1">
      <button
        type="button"
        onClick={() => changeLanguage("fr")}
        className={cn(
          "px-2 py-1 text-xs rounded-md transition-colors",
          lang === "fr"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted"
        )}
      >
        FR
      </button>
      <button
        type="button"
        onClick={() => changeLanguage("en")}
        className={cn(
          "px-2 py-1 text-xs rounded-md transition-colors",
          lang === "en"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted"
        )}
      >
        EN
      </button>
    </div>
  );
}

