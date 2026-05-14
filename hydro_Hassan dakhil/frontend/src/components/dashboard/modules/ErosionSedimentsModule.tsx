import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SedimentModule } from "@/components/dashboard/modules/SedimentModule";
import { SolidYieldModuleV2 } from "@/components/dashboard/modules/SolidYieldModuleV2";

type ErosionSubModule = "sediments" | "solidYield";

export function ErosionSedimentsModule() {
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
            <TabsTrigger value="sediments">Érosion / Sédiments</TabsTrigger>
            <TabsTrigger value="solidYield">Apport solide</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {activeTab === "sediments" ? <SedimentModule /> : <SolidYieldModuleV2 />}
    </div>
  );
}
