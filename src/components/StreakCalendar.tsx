import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Flame, Snowflake } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StreakCalendarProps {
  area?: string;
  userId?: string;
}

interface DayData {
  date: string;
  hasActivity: boolean;
  frozeUsed: boolean;
  xpEarned: number;
}

export function StreakCalendar({ area, userId }: StreakCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dayData, setDayData] = useState<Record<string, DayData>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMonthData();
  }, [currentMonth, area, userId]);

  const loadMonthData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = userId || user?.id;
      if (!targetUserId) return;

      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      // Load activity logs for the month (filter by area if provided)
      let logsQuery = supabase
        .from("activity_logs")
        .select("completed_at, xp_earned")
        .eq("user_id", targetUserId)
        .gte("completed_at", startOfMonth.toISOString())
        .lte("completed_at", endOfMonth.toISOString());
      
      if (area) {
        logsQuery = logsQuery.eq("area", area as any);
      }
      
      const { data: logs } = await logsQuery;

      // Also check spiritual logs if this is the spiritual area or no area specified
      let spiritualLogs: any[] = [];
      if (!area || area === "spiritual") {
        const { data: sLogs } = await supabase
          .from("spiritual_logs")
          .select("created_at, xp_earned")
          .eq("user_id", targetUserId)
          .gte("created_at", startOfMonth.toISOString())
          .lte("created_at", endOfMonth.toISOString());
        spiritualLogs = sLogs || [];
      }

      // Build day data map
      const dataMap: Record<string, DayData> = {};
      
      logs?.forEach(log => {
        const date = new Date(log.completed_at).toISOString().split('T')[0];
        if (!dataMap[date]) {
          dataMap[date] = { date, hasActivity: true, frozeUsed: false, xpEarned: log.xp_earned || 0 };
        } else {
          dataMap[date].xpEarned += log.xp_earned || 0;
        }
      });

      spiritualLogs.forEach(log => {
        const date = new Date(log.created_at).toISOString().split('T')[0];
        if (!dataMap[date]) {
          dataMap[date] = { date, hasActivity: true, frozeUsed: false, xpEarned: log.xp_earned || 0 };
        } else {
          dataMap[date].xpEarned += log.xp_earned || 0;
        }
      });

      setDayData(dataMap);
    } catch (error) {
      console.error("Error loading calendar data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days: (number | null)[] = [];
    
    // Add empty slots for days before the first day of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const formatDateKey = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-${String(day).padStart(2, '0')}`;
  };

  const getDayClass = (day: number | null) => {
    if (day === null) return "";
    
    const dateKey = formatDateKey(day);
    const data = dayData[dateKey];
    const today = new Date().toISOString().split('T')[0];
    const isToday = dateKey === today;
    const isFuture = dateKey > today;

    if (isFuture) {
      return "bg-muted/30 text-muted-foreground";
    }
    
    if (data?.hasActivity) {
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/50";
    }
    
    if (data?.frozeUsed) {
      return "bg-blue-500/20 text-blue-400 border-blue-500/50";
    }

    // Past day with no activity
    if (!isFuture && dateKey < today) {
      return "bg-destructive/10 text-destructive/60";
    }

    if (isToday) {
      return "border-primary bg-primary/10";
    }

    return "bg-muted/50";
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const days = getDaysInMonth();
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Calculate stats
  const today = new Date().toISOString().split('T')[0];
  const activeDays = Object.values(dayData).filter(d => d.hasActivity && d.date <= today).length;
  const totalXp = Object.values(dayData).reduce((sum, d) => sum + d.xpEarned, 0);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Flame className="w-5 h-5 text-destructive" />
            Streak Calendar
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={prevMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium min-w-[140px] text-center">{monthName}</span>
            <Button variant="ghost" size="icon" onClick={nextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Day labels */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs text-muted-foreground font-medium">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => (
            <div
              key={index}
              className={`aspect-square flex items-center justify-center text-sm rounded-md border border-transparent transition-colors ${getDayClass(day)}`}
            >
              {day && (
                <div className="relative">
                  <span>{day}</span>
                  {dayData[formatDateKey(day)]?.frozeUsed && (
                    <Snowflake className="w-3 h-3 absolute -top-1 -right-2 text-blue-400" />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Legend and stats */}
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/50" />
              <span>Active</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-blue-500/20 border border-blue-500/50" />
              <span>Freeze</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-destructive/10" />
              <span>Missed</span>
            </div>
          </div>
          <div className="text-right">
            <span className="font-medium text-foreground">{activeDays}</span> active days • 
            <span className="font-medium text-xp ml-1">{totalXp}</span> XP
          </div>
        </div>
      </CardContent>
    </Card>
  );
}