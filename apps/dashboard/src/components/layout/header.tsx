'use client';

import { Bell, Search, User, RefreshCw, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';


export function Header() {
  const [time, setTime] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card/50 px-6 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search services, incidents..."
            className="w-64 pl-9 bg-muted/50"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-2 rounded-lg bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground md:flex">
          <Clock className="h-4 w-4" />
          <span>{time.toLocaleTimeString('en-US', { hour12: false })}</span>
          <span className="text-xs opacity-50">UTC</span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          className={isRefreshing ? 'animate-spin' : ''}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium">
                3
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <div className="flex w-full items-center justify-between">
                <Badge variant="destructive" className="text-xs">Critical</Badge>
                <span className="text-xs text-muted-foreground">2m ago</span>
              </div>
              <span className="text-sm">API Gateway response time degraded</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <div className="flex w-full items-center justify-between">
                <Badge variant="secondary" className="text-xs">Warning</Badge>
                <span className="text-xs text-muted-foreground">15m ago</span>
              </div>
              <span className="text-sm">Memory usage exceeded 80% threshold</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <div className="flex w-full items-center justify-between">
                <Badge variant="outline" className="text-xs">Info</Badge>
                <span className="text-xs text-muted-foreground">1h ago</span>
              </div>
              <span className="text-sm">Scheduled maintenance completed</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary/10 text-primary">OP</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Operations Team</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Preferences</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}