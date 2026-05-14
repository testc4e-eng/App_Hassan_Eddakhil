import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SedimentModule } from "@/components/dashboard/modules/SedimentModule";
import { SolidYieldModuleV2 } from "@/components/dashboard/modules/SolidYieldModuleV2";

type ErosionSubModule = "sediments" | "solidYield";

export function ErosionSedimentsModuleV2() {
  const [activeTab, setActiveTab] = useState<ErosionSubModule>("sediments");

  return (
    <div className="w-full space-y-4">
      <div className="w-full px-4 lg:px-6">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as ErosionSubModule)}
          className="w-full"
        >
          <TabsList className="grid w-full max-w-2xl grid-cols-2 gap-2 bg-transparent p-0">
            <TabsTrigger
              value="sediments"
              className="h-12 rounded-xl border border-amber-300 bg-amber-50 text-base font-semibold text-amber-900 transition-all data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=active]:shadow-md"
            >
              Érosion / Sédiments
            </TabsTrigger>
            <TabsTrigger
              value="solidYield"
              className="h-12 rounded-xl border border-orange-300 bg-orange-50 text-base font-semibold text-orange-900 transition-all data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md"
            >
              Apport solide
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {activeTab === "sediments" ? <SedimentModule /> : <SolidYieldModuleV2 />}
    </div>
  );
}

