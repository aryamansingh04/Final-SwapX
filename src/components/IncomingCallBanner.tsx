import { useEffect, useState } from "react";
import { Phone, PhoneOff, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/stores/useAuthStore";
import { getIncomingCalls, updateCallStatus, type ApiCall } from "@/lib/social-api";
import { getToken } from "@/lib/api";
import { getProfileById } from "@/lib/profile";
import { toast } from "sonner";

const IncomingCallBanner = () => {
  const { user } = useAuthStore();
  const [incomingCalls, setIncomingCalls] = useState<ApiCall[]>([]);
  const [callerNames, setCallerNames] = useState<Record<string, { name: string; avatar: string }>>({});

  useEffect(() => {
    if (!user || !getToken()) return;

    const refresh = async () => {
      const calls = await getIncomingCalls();
      setIncomingCalls(calls);

      const profiles = await Promise.all(
        calls.map(async (call) => {
          const profile = await getProfileById(call.from_user_id);
          return {
            id: call.from_user_id,
            name: profile?.full_name || profile?.username || "User",
            avatar:
              profile?.avatar_url ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${call.from_user_id}`,
          };
        })
      );

      setCallerNames(
        Object.fromEntries(profiles.map((profile) => [profile.id, profile]))
      );
    };

    refresh();
    window.addEventListener("notificationsUpdated", refresh);
    const interval = window.setInterval(refresh, 5000);

    return () => {
      window.removeEventListener("notificationsUpdated", refresh);
      window.clearInterval(interval);
    };
  }, [user]);

  if (!user || incomingCalls.length === 0) return null;

  const activeCall = incomingCalls[0];
  const caller = callerNames[activeCall.from_user_id] ?? {
    name: "User",
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeCall.from_user_id}`,
  };

  const handleAnswer = async () => {
    await updateCallStatus(activeCall.id, "answered");
    window.open(activeCall.link, "_blank");
    toast.success(`Joined call with ${caller.name}`);
    setIncomingCalls((prev) => prev.filter((call) => call.id !== activeCall.id));
  };

  const handleDecline = async () => {
    await updateCallStatus(activeCall.id, "missed");
    toast.info("Call declined");
    setIncomingCalls((prev) => prev.filter((call) => call.id !== activeCall.id));
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[min(100vw-2rem,22rem)] rounded-xl border bg-card p-4 shadow-xl animate-in slide-in-from-bottom-4">
      <div className="flex items-center gap-3 mb-4">
        <Avatar className="h-12 w-12 ring-2 ring-green-500 ring-offset-2">
          <AvatarImage src={caller.avatar} alt={caller.name} />
          <AvatarFallback>{caller.name[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{caller.name}</p>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Video className="h-3.5 w-3.5" />
            Incoming {activeCall.type} call
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button className="flex-1" onClick={handleAnswer}>
          <Phone className="h-4 w-4 mr-2" />
          Answer
        </Button>
        <Button variant="destructive" className="flex-1" onClick={handleDecline}>
          <PhoneOff className="h-4 w-4 mr-2" />
          Decline
        </Button>
      </div>
    </div>
  );
};

export default IncomingCallBanner;
