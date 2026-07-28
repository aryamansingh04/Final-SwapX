import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Upload, Plus, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/useAuthStore";
import { useProfileStore } from "@/stores/useProfileStore";
import { createMyProfile, updateMyProfile, getMyProfile } from "@/lib/profile";
import { useAppAuth } from "@/hooks/useAppAuth";
import { Loader2 } from "lucide-react";

const OCCUPATIONS = [
  "Student",
  "Software Engineer",
  "Designer",
  "Data Scientist",
  "Product Manager",
  "Marketing",
  "Sales",
  "Consultant",
  "Entrepreneur",
  "Teacher",
  "Researcher",
  "Other",
];





const AVATAR_PRESETS = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Taylor",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Morgan",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Casey",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Riley",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Avery",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Quinn",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Sage",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=River",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Phoenix",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Skylar",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Rowan",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Blake",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Cameron",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Drew",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Emery",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Finley",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Hayden",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Jamie",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Kai",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Logan",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Noah",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Reese",
];

const ProfileSetup = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const { getProfile, updateProfile, setProfile } = useProfileStore();
  const { isLoading: authLoading } = useAppAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [existingSupabaseProfile, setExistingSupabaseProfile] = useState<any>(null);
  
  
  const existingProfile = user ? getProfile(user.id) : null;
  
  
  const [name, setName] = useState(existingProfile?.name || user?.name || "");
  const [occupation, setOccupation] = useState(existingProfile?.occupation || "");
  const [avatar, setAvatar] = useState(existingProfile?.avatar || user?.avatar || AVATAR_PRESETS[0]);
  const [avatarMode, setAvatarMode] = useState<"upload" | "preset">("preset");
  const [avatarDropdownOpen, setAvatarDropdownOpen] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>(existingProfile?.skills || []);
  const [skillToLearnInput, setSkillToLearnInput] = useState("");
  const [skillsToLearn, setSkillsToLearn] = useState<string[]>(existingProfile?.skillsToLearn || []);
  
  
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      try {
        const profile = await getMyProfile();
        if (!profile) return;
        setExistingSupabaseProfile(profile);
        if (profile.full_name || profile.username) setName(profile.full_name || profile.username || "");
        if (profile.bio) setOccupation(profile.bio);
        if (profile.avatar_url) setAvatar(profile.avatar_url);
        if (profile.skills?.length) setSkills(profile.skills);
        if (profile.skills_to_learn?.length) setSkillsToLearn(profile.skills_to_learn);
      } catch (error) {
        console.error("Error loading profile:", error);
      }
    };
    loadProfile();
  }, [user]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size should be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
        setAvatarMode("upload");
      };
      reader.readAsDataURL(file);
    }
  };

  const selectAvatar = (avatarUrl: string) => {
    setAvatar(avatarUrl);
    setAvatarMode("preset");
    setAvatarDropdownOpen(false);
  };

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const addSkillToLearn = () => {
    if (skillToLearnInput.trim() && !skillsToLearn.includes(skillToLearnInput.trim())) {
      setSkillsToLearn([...skillsToLearn, skillToLearnInput.trim()]);
      setSkillToLearnInput("");
    }
  };

  const removeSkillToLearn = (skill: string) => {
    setSkillsToLearn(skillsToLearn.filter(s => s !== skill));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("You must be logged in to save your profile");
      navigate("/auth/login");
      return;
    }

    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!occupation) {
      toast.error("Please select your occupation");
      return;
    }

    setIsLoading(true);

    const userId = user.id;
    const userEmail = user.email ?? "";

    try {
      const existingApiProfile = await getMyProfile();

      if (existingApiProfile) {
        const updatedProfile = await updateMyProfile({
          full_name: name.trim(),
          username: name.trim().toLowerCase().replace(/\s+/g, "_"),
          avatar_url: avatar,
          bio: occupation,
          skills,
          skills_to_learn: skillsToLearn,
          desired_skills: skillsToLearn,
        });
        setExistingSupabaseProfile(updatedProfile);
      } else {
        const createdProfile = await createMyProfile({
          username: name.trim().toLowerCase().replace(/\s+/g, "_"),
          full_name: name.trim(),
          avatar_url: avatar,
          bio: occupation,
          skills,
          skills_to_learn: skillsToLearn,
          desired_skills: skillsToLearn,
        });
        setExistingSupabaseProfile(createdProfile);
      }

      if (existingProfile) {
        updateProfile(userId, {
          name: name.trim(),
          avatar,
          occupation,
          skills,
          skillsToLearn,
        });
      } else {
        setProfile({
          id: userId,
          email: userEmail,
          name: name.trim(),
          avatar,
          occupation,
          skills,
          skillsToLearn,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      if (user) {
        setUser({
          ...user,
          name: name.trim(),
          avatar,
        });
      }

      toast.success("Profile saved successfully!");
      setIsLoading(false);

      const destination = "/dashboard";
      setTimeout(() => {
        navigate(destination, { replace: true, state: { refresh: true, timestamp: Date.now() } });
      }, 300);
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save profile. Please try again.");
      setIsLoading(false);
    }
  };

  
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[image:var(--gradient-soft)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[image:var(--gradient-soft)]">
        <div className="w-full max-w-md">
          <Card className="backdrop-blur-sm bg-card/95 shadow-2xl border-2">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <img src="/swapx-logo.svg" alt="SwapX" className="h-10" />
              </div>
              <CardTitle className="text-2xl font-bold text-center">Get Started</CardTitle>
              <CardDescription className="text-center">
                Sign in to create your profile and start learning
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild className="w-full">
                <Link to="/auth/login">Sign in</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/auth/signup">Create account</Link>
              </Button>
              <div className="rounded-lg border bg-muted/50 p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Demo accounts</p>
                <p>Account 1: demo@swapx.com / Demo@123</p>
                <p>Account 2: demo2@swapx.com / Demo2@456</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[image:var(--gradient-soft)]">
      <div className="w-full max-w-2xl">
        <Card className="backdrop-blur-sm bg-card/95 shadow-2xl border-2">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-display">Complete Your Profile</CardTitle>
            <CardDescription className="text-lg">
              Let's set up your profile to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="space-y-2">
                <Label htmlFor="name" className="text-base font-semibold">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-12 text-base"
                />
              </div>

              
              <div className="space-y-2">
                <Label htmlFor="occupation" className="text-base font-semibold">
                  Current Occupation <span className="text-destructive">*</span>
                </Label>
                <Select value={occupation} onValueChange={setOccupation} required>
                  <SelectTrigger id="occupation" className="h-12 text-base">
                    <SelectValue placeholder="Select your occupation" />
                  </SelectTrigger>
                  <SelectContent>
                    {OCCUPATIONS.map((occ) => (
                      <SelectItem key={occ} value={occ}>
                        {occ}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              
              <div className="space-y-4">
                <Label className="text-base font-semibold">Profile Picture</Label>
                <div className="flex flex-col items-center gap-4">
                  <Avatar className="h-32 w-32 border-4 border-primary/30">
                    <AvatarImage src={avatar} alt="Profile" />
                    <AvatarFallback className="text-2xl">
                      {name.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex gap-3 w-full max-w-md">
                    <Button
                      type="button"
                      variant={avatarMode === "upload" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        fileInputRef.current?.click();
                        setAvatarMode("upload");
                      }}
                      className="gap-2 flex-1"
                    >
                      <Upload className="h-4 w-4" />
                      Upload Photo
                    </Button>
                    <Popover open={avatarDropdownOpen} onOpenChange={setAvatarDropdownOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant={avatarMode === "preset" ? "default" : "outline"}
                          size="sm"
                          className="gap-2 flex-1"
                          onClick={() => setAvatarMode("preset")}
                        >
                          <User className="h-4 w-4" />
                          Choose Avatar
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-4" align="center">
                        <div className="space-y-3">
                          <Label className="text-sm font-semibold">Select an avatar</Label>
                          <div className="grid grid-cols-5 gap-3 max-h-[350px] overflow-y-auto">
                            {AVATAR_PRESETS.map((preset, index) => (
                              <button
                                key={`avatar-${index}`}
                                type="button"
                                onClick={() => selectAvatar(preset)}
                                className={`relative h-14 w-14 rounded-full overflow-hidden border-2 transition-all hover:scale-110 ${
                                  avatar === preset
                                    ? "border-primary ring-2 ring-primary/20"
                                    : "border-muted hover:border-primary/50"
                                }`}
                              >
                                <img
                                  src={preset}
                                  alt={`Avatar ${index + 1}`}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>

              
              <div className="space-y-3">
                <Label className="text-base font-semibold">Skills I Can Teach</Label>
                <div className="flex gap-2">
                  <Input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    placeholder="Add a skill (e.g., React, Python, Design)"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    className="h-12 text-base"
                  />
                  <Button type="button" size="icon" onClick={addSkill} className="h-12 w-12">
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg min-h-[3rem]">
                    {skills.map((skill) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="bg-primary/10 text-primary text-sm py-1.5 px-3"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="ml-2 hover:text-destructive transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              
              <div className="space-y-3">
                <Label className="text-base font-semibold">Skills I Want to Learn</Label>
                <div className="flex gap-2">
                  <Input
                    value={skillToLearnInput}
                    onChange={(e) => setSkillToLearnInput(e.target.value)}
                    placeholder="Add a skill you want to learn (e.g., Machine Learning, UI/UX, DevOps)"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkillToLearn())}
                    className="h-12 text-base"
                  />
                  <Button type="button" size="icon" onClick={addSkillToLearn} className="h-12 w-12">
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
                {skillsToLearn.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg min-h-[3rem]">
                    {skillsToLearn.map((skill) => (
                      <Badge
                        key={skill}
                        variant="outline"
                        className="bg-accent/10 text-accent border-accent/20 text-sm py-1.5 px-3"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkillToLearn(skill)}
                          className="ml-2 hover:text-destructive transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full h-12 text-base" size="lg" disabled={isLoading}>
                {isLoading ? "Saving..." : "Complete Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileSetup;
