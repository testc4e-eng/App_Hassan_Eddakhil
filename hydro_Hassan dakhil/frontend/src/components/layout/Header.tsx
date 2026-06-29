import { Droplets, Cloud, Waves, GitCompare, BarChart3, Menu } from 'lucide-react';
import type { ModuleType } from '@/types/hydro';
import { cn } from '@/lib/utils';

interface HeaderProps {
  activeModule: ModuleType;
  onModuleChange: (module: ModuleType) => void;
  onToggleSidebar: () => void;
}

const modules = [
  { id: 'climate' as ModuleType, label: 'Suivi Climatologie', icon: Cloud, className: 'module-btn-climate' },
  { id: 'hydraulic' as ModuleType, label: 'Hydraulique', icon: Waves, className: 'module-btn-hydraulic' },
  { id: 'sediment' as ModuleType, label: 'Sédiments', icon: BarChart3, className: 'module-btn-sediment' },
  { id: 'comparison' as ModuleType, label: 'Comparaison', icon: GitCompare, className: 'module-btn-comparison' },
];

export function Header({ activeModule, onModuleChange, onToggleSidebar }: HeaderProps) {
  return (
    <header className="h-14 bg-card border-b border-border px-4 flex items-center justify-between sticky top-0 z-50">
      {/* Logo & Title */}
      <div className="flex items-center gap-3">
        <button 
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg gradient-hydro flex items-center justify-center">
            <Droplets className="w-4 h-4 text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-semibold text-foreground leading-tight">
              Hydro-Data Intelligence
            </h1>
            <p className="text-[11px] text-muted-foreground">
              Barrage Hassan Addakhil
            </p>
          </div>
        </div>
      </div>

      {/* Module Navigation */}
      <nav className="flex items-center gap-2">
        {modules.map((module) => {
          const Icon = module.icon;
          const isActive = activeModule === module.id;
          
          return (
            <button
              key={module.id}
              onClick={() => onModuleChange(module.id)}
              className={cn(
                'module-btn flex items-center gap-2',
                isActive ? module.className : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden md:inline">{module.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
}
