'use client';

import {
  LayoutDashboard,
  AlertTriangle,
  CheckCircle2,
  Activity,
  FileText,
  Settings,
  ChevronLeft,
  Shield,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Overview', href: '/overview', icon: LayoutDashboard },
  { name: 'Active Incidents', href: '/incidents/active', icon: AlertTriangle },
  { name: 'Resolved', href: '/incidents/resolved', icon: CheckCircle2 },
  { name: 'Post-Mortem', href: '/post-mortem', icon: FileText },
  { name: 'System Health', href: '/health', icon: Activity },
  { name: 'Logs', href: '/logs', icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-16 flex-col border-r border-border bg-card/50 backdrop-blur-xl lg:w-64">
      <div className="flex h-16 items-center justify-center border-b border-border px-4 lg:justify-start">
        <Link href="/overview" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <span className="hidden text-lg font-bold lg:block gradient-text">Sentinel</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Tooltip key={item.name} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  )}
                >
                  <Icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-primary')} />
                  <span className="hidden lg:block">{item.name}</span>
                  {isActive && (
                    <div className="ml-auto hidden h-1.5 w-1.5 rounded-full bg-primary lg:block" />
                  )}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="lg:hidden">
                {item.name}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      <div className="border-t border-border p-2">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Link
              href="/settings"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
            >
              <Settings className="h-5 w-5 flex-shrink-0" />
              <span className="hidden lg:block">Settings</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" className="lg:hidden">
            Settings
          </TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
}