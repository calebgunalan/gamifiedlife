import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DailyLoginData {
  consecutiveDays: number;
  bonusClaimed: boolean;
  xpEarned: number;
}

export function useDailyLogin() {
  const { toast } = useToast();
  const [loginData, setLoginData] = useState<DailyLoginData | null>(null);

  useEffect(() => {
    checkDailyLogin();
  }, []);

  const checkDailyLogin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Check if already logged in today
    const { data: todayLogin } = await supabase
      .from("daily_logins")
      .select("*")
      .eq("user_id", user.id)
      .eq("login_date", today)
      .single();

    if (todayLogin) {
      setLoginData({
        consecutiveDays: todayLogin.consecutive_days,
        bonusClaimed: todayLogin.bonus_claimed,
        xpEarned: 0
      });
      return;
    }

    // Check yesterday's login for streak
    const { data: yesterdayLogin } = await supabase
      .from("daily_logins")
      .select("*")
      .eq("user_id", user.id)
      .eq("login_date", yesterdayStr)
      .single();

    const consecutiveDays = yesterdayLogin ? (yesterdayLogin.consecutive_days + 1) : 1;

    // Calculate XP bonus based on streak
    let xpBonus = 5; // Base daily login bonus
    if (consecutiveDays === 7) xpBonus = 50;
    else if (consecutiveDays % 7 === 0) xpBonus = 25;
    else if (consecutiveDays >= 14) xpBonus = 10;

    // Insert today's login
    const { error } = await supabase
      .from("daily_logins")
      .insert({
        user_id: user.id,
        login_date: today,
        consecutive_days: consecutiveDays,
        bonus_claimed: true
      });

    if (error) {
      console.error("Error logging daily login:", error);
      return;
    }

    // Award XP to profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("total_xp, monthly_xp")
      .eq("id", user.id)
      .single();

    if (profile) {
      await supabase
        .from("profiles")
        .update({
          total_xp: (profile.total_xp || 0) + xpBonus,
          monthly_xp: (profile.monthly_xp || 0) + xpBonus
        })
        .eq("id", user.id);
    }

    setLoginData({
      consecutiveDays,
      bonusClaimed: true,
      xpEarned: xpBonus
    });

    // Show toast notification
    toast({
      title: `Daily Login Bonus! 🎉`,
      description: `${consecutiveDays} day streak! You earned ${xpBonus} XP!`
    });
  };

  return loginData;
}
