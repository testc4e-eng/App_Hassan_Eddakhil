import AccessDashboard from "../components/access/AccessDashboard";
import { useTranslation } from "react-i18next";

export default function AccessDashboardPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">{t("access.title")}</h1>
          <p className="text-sm text-slate-500">
            Consultation des séries importées depuis le fichier Microsoft Access.
          </p>
        </div>
        <AccessDashboard />
      </div>
    </div>
  );
}
