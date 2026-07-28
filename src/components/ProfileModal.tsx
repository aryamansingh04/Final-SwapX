import { Star, FileText, Github, Linkedin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/useAuthStore";
import { isDemoUserId } from "@/lib/demo-accounts";
import {
  getDemoConnectionStatus,
  isDemoUsersConnected,
  sendDemoConnectionRequest,
} from "@/lib/demo-sync";

interface ProfileModalProps {
  user: {
    id: string;
    name: string;
    avatar: string;
    bio: string;
    location: string;
    skillsKnown: string[];
    skillsToLearn: string[];
    trustScore: number;
    totalSessions: number;
    github?: string;
    linkedin?: string;
    proofs: Array<{ type: string; url: string; skill: string }>;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

const ProfileModal = ({ user, isOpen, onClose }: ProfileModalProps) => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();

  if (!user) return null;

  const handleConnect = () => {
    if (!currentUser) {
      toast.error("Please sign in first");
      return;
    }

    if (isDemoUserId(currentUser.id) && isDemoUserId(user.id)) {
      if (isDemoUsersConnected(currentUser.id, user.id)) {
        toast.info("You are already connected with this user");
        navigate(`/chat/${user.id}`);
        onClose();
        return;
      }

      const status = getDemoConnectionStatus(currentUser.id, user.id);
      if (status === "pending-sent") {
        toast.info("Connection request already sent");
        navigate(`/chat/${user.id}`);
        onClose();
        return;
      }

      try {
        sendDemoConnectionRequest(currentUser.id, user.id, {
          message: `Hi ${user.name}, let's swap skills on SwapX!`,
          skill: user.skillsToLearn[0] || user.skillsKnown[0] || "Skill Swap",
        });
        toast.success("Connection request sent!");
        setTimeout(() => {
          onClose();
          navigate(`/chat/${user.id}`);
        }, 500);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to send request");
      }
      return;
    }

    const connectionRequestsSent = JSON.parse(
      localStorage.getItem("connectionRequestsSent") || "[]"
    );
    const connectionRequestsReceived = JSON.parse(
      localStorage.getItem("connectionRequestsReceived") || "[]"
    );
    const connections = JSON.parse(
      localStorage.getItem("connections") || "[]"
    );

    
    if (connections.includes(user.id)) {
      toast.info("You are already connected with this user");
      navigate(`/chat/${user.id}`);
      onClose();
      return;
    }

    
    if (connectionRequestsSent.some((r: any) => r.userId === user.id)) {
      toast.info("Connection request already sent");
      navigate(`/chat/${user.id}`);
      onClose();
      return;
    }

    
    const newRequest = {
      id: Date.now().toString(),
      userId: user.id,
      name: user.name,
      avatar: user.avatar,
      sentAt: new Date().toISOString(),
      status: "pending",
    };

    connectionRequestsSent.push(newRequest);
    localStorage.setItem("connectionRequestsSent", JSON.stringify(connectionRequestsSent));

    
    const notifications = JSON.parse(localStorage.getItem("notifications") || "[]");
    const newNotification = {
      id: Date.now().toString(),
      title: "Connection Request Sent",
      message: `You sent a connection request to ${user.name}`,
      type: "connection",
      isRead: false,
      timestamp: new Date().toISOString(),
      link: `/chat/${user.id}`,
    };
    notifications.unshift(newNotification);
    
    const limitedNotifications = notifications.slice(0, 50);
    localStorage.setItem("notifications", JSON.stringify(limitedNotifications));

    
    window.dispatchEvent(new Event("connectionRequestsUpdated"));
    window.dispatchEvent(new Event("chatsUpdated"));
    window.dispatchEvent(new Event("notificationsUpdated"));

    toast.success("Connection request sent!");
    setTimeout(() => {
      onClose();
      navigate(`/chat/${user.id}`);
    }, 500);
  };

  const handleProofClick = (proofUrl: string, skill: string) => {
    
    const params = new URLSearchParams({
      url: proofUrl,
      skill: skill,
    });
    navigate(`/proof?${params.toString()}`);
    onClose(); 
  };

  
  const pdfProofs = user.proofs.filter(proof => proof.type === "pdf");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-4 mb-4">
            <Avatar className="h-20 w-20 border-2 border-primary/20">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <DialogTitle className="text-2xl">{user.name}</DialogTitle>
                <div className="flex items-center gap-2">
                  {user.github && (
                    <a
                      href={user.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                      aria-label="GitHub Profile"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Github className="h-5 w-5" />
                    </a>
                  )}
                  {user.linkedin && (
                    <a
                      href={user.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                      aria-label="LinkedIn Profile"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Linkedin className="h-5 w-5" />
                    </a>
                  )}
                </div>
              </div>
              <DialogDescription className="text-base">{user.bio}</DialogDescription>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <span className="font-medium">{user.trustScore}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {user.totalSessions} sessions completed
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        <div className="space-y-6 py-4">
          <div>
            <h3 className="font-semibold mb-3">Skills Teaching</h3>
            <div className="flex flex-wrap gap-2">
              {user.skillsKnown.map((skill) => (
                <Badge key={skill} variant="secondary" className="bg-primary/10 text-primary">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Skills Learning</h3>
            <div className="flex flex-wrap gap-2">
              {user.skillsToLearn.map((skill) => (
                <Badge key={skill} variant="outline">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          {pdfProofs.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Skill Proofs</h3>
              <div className="grid grid-cols-2 gap-3">
                {pdfProofs.map((proof, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleProofClick(proof.url, proof.skill)}
                    className="p-3 border rounded-lg hover:bg-muted/50 hover:border-primary/50 cursor-pointer transition-colors text-left group"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-medium">{proof.skill}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">PDF proof</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <Separator />

        <div className="flex gap-3 pt-4">
          <Button onClick={handleConnect} className="flex-1">
            Connect
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileModal;
