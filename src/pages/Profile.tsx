import { useParams, useNavigate, useLocation } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Award, Star, Github, Linkedin, Pencil, FileText, ChevronDown, ChevronUp, Upload, AlertCircle, CheckCircle2, X } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useProfileStore } from "@/stores/useProfileStore";
import { useAuthUser } from "@/hooks/useAuthUser";
import { getMyProfile, getProfileById } from "@/lib/profile";
import { getUserProofs, ProofWithSkill, saveProof } from "@/lib/proofs";
import { uploadFile } from "@/lib/storage";
import { mockUsers } from "@/data/mockUsers";
import { useEffect, useState, useRef } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

const Profile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { user: apiUser } = useAuthUser();
  const { getProfile } = useProfileStore();
  const [supabaseProfile, setSupabaseProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [proofs, setProofs] = useState<ProofWithSkill[]>([]);
  const [expandedProof, setExpandedProof] = useState<{ url: string; skill: string } | null>(null);
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);
  const [uploadingProofs, setUploadingProofs] = useState<Record<string, boolean>>({});
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  
  
  const [refreshKey, setRefreshKey] = useState(0);
  
  
  const currentUserId = apiUser?.id || user?.id;
  const isOwnProfile = !id || id === currentUserId || id === user?.id;
  const profileId = id || currentUserId;
  
  
  useEffect(() => {
    const loadProfileAndProofs = async () => {
      if (isOwnProfile && apiUser) {
        try {
          setLoading(true);
          const profile = await getMyProfile();
          if (profile) {
            setSupabaseProfile(profile);
          } else {
            setSupabaseProfile(null);
          }

          if (apiUser.id) {
            try {
              const userProofs = await getMyProofs();
              setProofs(userProofs ?? []);
            } catch (proofError) {
              console.error("Error loading proofs from Supabase:", proofError);
              try {
                const fallbackProofs = await getUserProofs(apiUser.id);
                setProofs(fallbackProofs ?? []);
              } catch {
                setProofs([]);
              }
            }
          }
        } catch (error) {
          console.error("Error loading profile:", error);
          if (error instanceof Error && !error.message.includes("not authenticated")) {
            setSupabaseProfile(null);
          }
        } finally {
          setLoading(false);
        }
      } else if (isOwnProfile && user && !apiUser) {
        setLoading(false);
      } else if (profileId && id) {
        
        try {
          setLoading(true);
          const profile = await getProfileById(id);
          if (profile) {
            setSupabaseProfile(profile);
          }
          
          
          try {
            const userProofs = await getUserProofs(id);
            if (userProofs && userProofs.length > 0) {
              setProofs(userProofs);
            } else {
              
              const foundProfile = mockUsers.find(p => p.id === id);
              if (foundProfile?.proofs && foundProfile.proofs.length > 0) {
                setProofs(foundProfile.proofs);
              }
            }
          } catch (proofError) {
            console.error("Error loading proofs:", proofError);
            
            const foundProfile = mockUsers.find(p => p.id === id);
            if (foundProfile?.proofs && foundProfile.proofs.length > 0) {
              setProofs(foundProfile.proofs);
            }
          }
        } catch (error) {
          console.error("Error loading user profile:", error);
          
          const foundProfile = mockUsers.find(p => p.id === id);
          if (foundProfile?.proofs && foundProfile.proofs.length > 0) {
            setProofs(foundProfile.proofs);
          }
        } finally {
          setLoading(false);
        }
      } else {
        if (id) {
          const foundProfile = mockUsers.find((p) => p.id === id);
          if (foundProfile?.proofs && foundProfile.proofs.length > 0) {
            setProofs(foundProfile.proofs);
          } else {
            try {
              const userProofs = await getUserProofs(id);
              if (userProofs.length > 0) {
                setProofs(userProofs);
              }
            } catch (error) {
              console.error("Error loading proofs:", error);
            }
          }
        }
        setLoading(false);
      }
    };
    loadProfileAndProofs();
  }, [id, apiUser, user, refreshKey, isOwnProfile, currentUserId, profileId]);
  
  
  useEffect(() => {
    if (location.state?.refresh) {
      console.log("Refreshing profile due to navigation state");
      
      const reloadProfile = async () => {
        if (isOwnProfile && apiUser) {
          try {
            const freshProfile = await getMyProfile();
            if (freshProfile) {
              console.log("Reloaded fresh profile from Supabase:", {
                full_name: freshProfile.full_name,
                skills: freshProfile.skills,
                skills_to_learn: freshProfile.skills_to_learn,
                desired_skills: freshProfile.desired_skills,
              });
              setSupabaseProfile(freshProfile);
              
              
              try {
                console.log("Reloading proofs after profile refresh");
                const userProofs = await getMyProofs();
                console.log("Reloaded proofs:", userProofs);
                if (userProofs && userProofs.length > 0) {
                  setProofs(userProofs);
                } else {
                  
                  const fallbackProofs = await getUserProofs(apiUser.id);
                  if (fallbackProofs && fallbackProofs.length > 0) {
                    setProofs(fallbackProofs);
                  } else {
                    setProofs([]);
                  }
                }
              } catch (proofError) {
                console.error("Error reloading proofs:", proofError);
                
                try {
                  const fallbackProofs = await getUserProofs(apiUser.id);
                  if (fallbackProofs) {
                    setProofs(fallbackProofs);
                  }
                } catch (fallbackError) {
                  console.error("Fallback also failed:", fallbackError);
                }
              }
              
              setRefreshKey(prev => prev + 1);
            }
          } catch (error) {
            console.error("Error reloading profile:", error);
          }
        }
      };
      reloadProfile();
      
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate, isOwnProfile, apiUser]);

  
  useEffect(() => {
    const handleFocus = () => {
      
      if (apiUser || user) {
        if (isOwnProfile && apiUser) {
          
          const reloadData = async () => {
            try {
              const freshProfile = await getMyProfile();
              if (freshProfile) {
                setSupabaseProfile(freshProfile);
                console.log("Profile refreshed on focus:", {
                  skills: freshProfile.skills,
                  skills_to_learn: freshProfile.skills_to_learn,
                });
              }
              
              
              const freshProofs = await getMyProofs();
              if (freshProofs) {
                console.log("Proofs refreshed on focus:", freshProofs.length, "proofs");
                setProofs(freshProofs);
              }
            } catch (error) {
              console.error("Error reloading profile/proofs on focus:", error);
            }
          };
          reloadData();
        } else if (profileId && id) {
          
          getProfileById(id).then((profile) => {
            if (profile) {
              setSupabaseProfile(profile);
            }
          }).catch(console.error);
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [id, apiUser, user, isOwnProfile, profileId]);
  
  
  const storedProfile = profileId ? getProfile(profileId) : null;
  
  
  const foundProfile = id ? mockUsers.find(p => p.id === id) : null;

  
  let profile;
  
  
  if (supabaseProfile) {
    
    
    const skillsToLearn = supabaseProfile.skills_to_learn;
    const skillsToLearnArray = Array.isArray(skillsToLearn) 
      ? skillsToLearn 
      : (skillsToLearn ? [skillsToLearn] : []);
    
    
    console.log("Building profile from Supabase data:", {
      id: supabaseProfile.id,
      skills: supabaseProfile.skills,
      skills_to_learn_raw: skillsToLearn,
      skills_to_learn_processed: skillsToLearnArray,
    });
    
    profile = {
      id: supabaseProfile.id,
      name: supabaseProfile.full_name || supabaseProfile.username || apiUser?.name || user?.name || "User",
      email: apiUser?.email || user?.email || "",
      avatar: supabaseProfile.avatar_url || apiUser?.avatar || user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${supabaseProfile.full_name || "User"}`,
      bio: supabaseProfile.bio || "Passionate learner and teacher. Love sharing knowledge with the community!",
      skillsKnown: Array.isArray(supabaseProfile.skills) ? supabaseProfile.skills : (supabaseProfile.skills ? [supabaseProfile.skills] : []),
      skillsLearning: skillsToLearnArray,
      occupation: supabaseProfile.bio || "",
      rating: 4.8,
      totalSessions: 0,
      connections: 0,
      github: undefined,
      linkedin: undefined,
      availability: undefined,
    };
    
    console.log("Final profile object for display:", {
      skillsKnown: profile.skillsKnown,
      skillsLearning: profile.skillsLearning,
    });
  } else if (storedProfile && isOwnProfile) {
    
    profile = {
      id: storedProfile.id,
      name: storedProfile.name,
      email: storedProfile.email,
      avatar: storedProfile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${storedProfile.name}`,
      bio: storedProfile.bio || "Passionate learner and teacher. Love sharing knowledge with the community!",
      skillsKnown: storedProfile.skills || [],
      skillsLearning: storedProfile.skillsToLearn || [],
      occupation: storedProfile.occupation,
      rating: 4.8, 
      totalSessions: 0, 
      connections: 0, 
      github: storedProfile.github,
      linkedin: storedProfile.linkedin,
      availability: storedProfile.availability,
    };
  } else if (foundProfile) {
    
    profile = {
    id: foundProfile.id,
    name: foundProfile.name,
    email: user?.email || `${foundProfile.name.toLowerCase().replace(/\s+/g, '')}@example.com`,
    avatar: foundProfile.avatar,
    bio: foundProfile.bio,
    skillsKnown: foundProfile.skillsKnown,
    skillsLearning: foundProfile.skillsToLearn,
    rating: foundProfile.trustScore,
    totalSessions: foundProfile.totalSessions,
      connections: Math.floor(foundProfile.totalSessions * 0.7),
    github: foundProfile.github,
    linkedin: foundProfile.linkedin,
    };
  } else {
    
    profile = {
      id: profileId || "1",
    name: user?.name || "John Doe",
    email: user?.email || "john@example.com",
    avatar: user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || "User"}`,
    bio: "Passionate learner and teacher. Love sharing knowledge with the community!",
      skillsKnown: storedProfile?.skills || [],
      skillsLearning: storedProfile?.skillsToLearn || [],
    rating: 4.8,
      totalSessions: 0,
      connections: 0,
      github: storedProfile?.github || undefined,
      linkedin: storedProfile?.linkedin || undefined,
      availability: storedProfile?.availability,
    };
  }


  
  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading profile...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  
  if (isOwnProfile && !supabaseProfile && !storedProfile && !loading && (apiUser || user)) {
    const currentUser = apiUser || user;
    return (
      <Layout>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-4xl">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
                <AvatarImage 
                  src={
                    (apiUser?.avatar) || 
                    (user?.avatar) || 
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${apiUser?.email || user?.email || "User"}`
                  } 
                />
                <AvatarFallback className="text-xl sm:text-2xl">
                  {(apiUser?.email || user?.email || "U")[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold mb-2">Complete Your Profile</h2>
                <p className="text-muted-foreground text-sm sm:text-base mb-4 max-w-md mx-auto">
                  Set up your profile to start connecting with others and sharing your skills.
                </p>
                <Button onClick={() => navigate("/profile/setup")} className="mt-4">
                  <Pencil className="h-4 w-4 mr-2" />
                  Complete Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-4xl">
        <Card>
          <CardHeader className="pb-4 sm:pb-6">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center">
              <Avatar className="h-20 w-20 sm:h-24 sm:w-24 mx-auto sm:mx-0">
                <AvatarImage src={profile.avatar} alt={profile.name} />
                <AvatarFallback className="text-xl sm:text-2xl">{profile.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 w-full text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center sm:items-start justify-center sm:justify-start gap-2 sm:gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-2xl sm:text-3xl">{profile.name}</CardTitle>
                    {isOwnProfile && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate("/profile/setup")}
                        className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-primary"
                        aria-label="Edit Profile"
                        title="Edit Profile"
                      >
                        <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                    )}
                  </div>
                  {(profile.github || profile.linkedin) && (
                    <div className="flex items-center gap-2 ml-0 sm:ml-auto">
                    {profile.github && (
                      <a
                        href={profile.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors"
                        aria-label="GitHub Profile"
                      >
                          <Github className="h-4 w-4 sm:h-5 sm:w-5" />
                      </a>
                    )}
                    {profile.linkedin && (
                      <a
                        href={profile.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors"
                        aria-label="LinkedIn Profile"
                      >
                          <Linkedin className="h-4 w-4 sm:h-5 sm:w-5" />
                      </a>
                    )}
                  </div>
                  )}
                </div>
                {profile.bio && (
                  <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">{profile.bio}</p>
                )}
                {profile.occupation && (
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2">{profile.occupation}</p>
                )}
                <div className="flex flex-wrap gap-2 items-center justify-center sm:justify-start text-xs sm:text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-semibold">{profile.rating}</span>
                  </div>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">{profile.totalSessions} sessions</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">{profile.connections} connections</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 pt-4 sm:pt-6">
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 flex items-center gap-2">
                <Award className="h-4 w-4 sm:h-5 sm:w-5" />
                Skills {isOwnProfile ? "I Can Teach" : "They Can Teach"}
              </h3>
              {profile.skillsKnown.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.skillsKnown.map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs sm:text-sm px-2 py-1">
                    {skill}
                  </Badge>
                ))}
              </div>
              ) : (
                <p className="text-muted-foreground text-xs sm:text-sm">
                  {isOwnProfile ? "No skills added yet. Click the edit button to add skills!" : "No skills listed."}
                </p>
              )}
            </div>

            {}
            {isOwnProfile && profile.skillsKnown && profile.skillsKnown.length > 0 && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                      Upload Proof of Skills <span className="text-red-500">*</span>
                    </h3>
                  </div>
                  <Alert className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs sm:text-sm">
                      Proof of skills is required. Please upload at least one proof document for each skill you claim to teach.
                    </AlertDescription>
                  </Alert>
                  <div className="space-y-4">
                    {profile.skillsKnown.map((skill) => {
                      const skillProofs = proofs.filter(p => p.skill && p.skill.toLowerCase() === skill.toLowerCase());
                      const hasProof = skillProofs.length > 0;
                      const isUploading = uploadingProofs[skill] || false;
                      const selectedFile = selectedFiles[skill];
                      const fileInputRef = (el: HTMLInputElement | null) => {
                        fileInputRefs.current[skill] = el;
                      };

                      return (
                        <div key={skill} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm sm:text-base">{skill}</span>
                              {hasProof ? (
                                <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Proof Uploaded
                                </Badge>
                              ) : (
                                <Badge variant="destructive">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Proof Required
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {!hasProof && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <input
                                  ref={fileInputRef}
                                  type="file"
                                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.mp4,.mov,.avi"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      setSelectedFiles(prev => ({ ...prev, [skill]: file }));
                                    }
                                  }}
                                />
                                {!selectedFile ? (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fileInputRefs.current[skill]?.click()}
                                    disabled={isUploading}
                                    className="flex items-center gap-2"
                                  >
                                    <Upload className="h-4 w-4" />
                                    Upload Proof
                                  </Button>
                                ) : (
                                  <div className="flex items-center gap-2 w-full">
                                    <div className="flex-1 flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                                      <FileText className="h-4 w-4 text-primary" />
                                      <span className="text-sm truncate flex-1">{selectedFile.name}</span>
                                      <span className="text-xs text-muted-foreground">
                                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                      </span>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setSelectedFiles(prev => {
                                        const updated = { ...prev };
                                        delete updated[skill];
                                        return updated;
                                      })}
                                      disabled={isUploading}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                                {selectedFile && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={async () => {
                                      if (!selectedFile || !apiUser) {
                                        toast.error("Please select a file and ensure you're logged in");
                                        return;
                                      }

                                      try {
                                        setUploadingProofs(prev => ({ ...prev, [skill]: true }));
                                        
                                        
                                        const fileName = selectedFile.name.toLowerCase();
                                        let fileType = "pdf";
                                        if (fileName.endsWith(".pdf")) fileType = "pdf";
                                        else if (fileName.endsWith(".doc") || fileName.endsWith(".docx")) fileType = "pdf";
                                        else if (fileName.match(/\.(jpg|jpeg|png|gif)$/)) fileType = "image";
                                        else if (fileName.match(/\.(mp4|mov|avi|webm)$/)) fileType = "video";
                                        
                                        
                                        console.log(`Uploading proof for skill: ${skill}`);
                                        const { publicUrl: fileUrl } = await uploadFile("proofs", `${skill}-${Date.now()}`, selectedFile);
                                        console.log(`File uploaded successfully. URL: ${fileUrl}`);
                                        
                                        
                                        console.log(`Saving proof to database for skill: ${skill}`);
                                        const savedProof = await saveProof(skill, fileUrl, fileType);
                                        console.log(`Proof saved to database:`, savedProof);
                                        
                                        
                                        if (apiUser.id) {
                                          console.log(`Reloading proofs from Supabase for user: ${apiUser.id}`);
                                          const updatedProofs = await getUserProofs(apiUser.id);
                                          console.log(`Loaded ${updatedProofs.length} proofs from Supabase:`, updatedProofs);
                                          
                                          
                                          setProofs(updatedProofs);
                                          
                                          
                                          const newlyUploadedProof = updatedProofs.find(p => 
                                            p.skill.toLowerCase() === skill.toLowerCase() && 
                                            p.url === fileUrl
                                          );
                                          
                                          if (!newlyUploadedProof) {
                                            console.warn("Warning: Proof was saved but not found in reloaded proofs. This might be a caching issue.");
                                          } else {
                                            console.log("Successfully verified proof is in database:", newlyUploadedProof);
                                          }
                                        }
                                        
                                        
                                        setSelectedFiles(prev => {
                                          const updated = { ...prev };
                                          delete updated[skill];
                                          return updated;
                                        });
                                        
                                        toast.success(`Proof uploaded successfully for ${skill}! It will now appear on your profile.`);
                                        
                                        
                                        setRefreshKey(prev => prev + 1);
                                        
                                        
                                        try {
                                          const freshProfile = await getMyProfile();
                                          if (freshProfile) {
                                            setSupabaseProfile(freshProfile);
                                          }
                                        } catch (profileError) {
                                          console.warn("Could not reload profile after proof upload:", profileError);
                                        }
                                      } catch (error) {
                                        console.error("Error uploading proof:", error);
                                        toast.error(error instanceof Error ? error.message : "Failed to upload proof");
                                      } finally {
                                        setUploadingProofs(prev => {
                                          const updated = { ...prev };
                                          delete updated[skill];
                                          return updated;
                                        });
                                      }
                                    }}
                                    disabled={isUploading}
                                    className="flex items-center gap-2"
                                  >
                                    {isUploading ? (
                                      <>
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                        Uploading...
                                      </>
                                    ) : (
                                      <>
                                        <Upload className="h-4 w-4" />
                                        Save Proof
                                      </>
                                    )}
                                  </Button>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Accepted formats: PDF, DOC, DOCX, Images (JPG, PNG, GIF), Videos (MP4, MOV, AVI)
                              </p>
                            </div>
                          )}
                          
                          {hasProof && (
                            <div className="text-sm text-green-600 flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4" />
                              <span>Proof uploaded ({skillProofs.length} {skillProofs.length === 1 ? "file" : "files"})</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">Skills {isOwnProfile ? "I Want to Learn" : "They Want to Learn"}</h3>
              {profile.skillsLearning && profile.skillsLearning.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.skillsLearning.map((skill) => (
                    <Badge key={skill} variant="outline" className="text-xs sm:text-sm px-2 py-1">
                    {skill}
                  </Badge>
                ))}
              </div>
              ) : (
                <p className="text-muted-foreground text-xs sm:text-sm">
                  {isOwnProfile ? "No skills to learn added yet. Click the edit button to add skills you want to learn!" : "No skills to learn listed."}
                </p>
              )}
            </div>
            
            {}
            {profile.skillsKnown && profile.skillsKnown.length > 0 && (
              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                  Proofs of Skills {isOwnProfile ? "I Can Teach" : "They Can Teach"}
                </h3>
                {proofs.length > 0 ? (
                  <div className="space-y-3">
                    {profile.skillsKnown.map((skill) => {
                      const skillProofs = proofs.filter(p => p.skill && p.skill.toLowerCase() === skill.toLowerCase());
                      if (skillProofs.length === 0) return null;
                    
                      const isExpanded = expandedSkill === skill;
                      
                      return (
                        <div key={skill} className="border rounded-lg overflow-hidden">
                          <button
                            onClick={() => setExpandedSkill(isExpanded ? null : skill)}
                            className="w-full p-3 sm:p-4 flex items-center justify-between hover:bg-muted/50 transition-colors text-left"
                          >
                            <div className="flex items-center gap-2 sm:gap-3">
                              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                              <span className="font-medium text-sm sm:text-base">{skill}</span>
                              <Badge variant="secondary" className="text-xs">
                                {skillProofs.length} {skillProofs.length === 1 ? "proof" : "proofs"}
                              </Badge>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                            )}
                          </button>
                          {isExpanded && (
                            <div className="border-t bg-muted/30 p-3 sm:p-4 space-y-2">
                              {skillProofs.map((proof, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setExpandedProof({ url: proof.url, skill: proof.skill })}
                                  className="w-full p-3 border rounded-lg hover:bg-background hover:border-primary/50 transition-colors text-left group"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <FileText className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                                      <span className="text-sm font-medium">{proof.skill} Proof</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground uppercase">{proof.type}</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">Click to view document</p>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-xs sm:text-sm">
                    {isOwnProfile ? "No proofs uploaded yet. Upload proof documents to verify your skills!" : "No proofs available for this user."}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {}
      <Dialog open={!!expandedProof} onOpenChange={(open) => !open && setExpandedProof(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {expandedProof?.skill} - Proof Document
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {expandedProof?.url && expandedProof.url !== "#" ? (
              <div className="w-full" style={{ height: "calc(90vh - 150px)", minHeight: "500px" }}>
                <iframe
                  src={expandedProof.url}
                  className="w-full h-full border rounded-lg"
                  title={`${expandedProof.skill} Proof`}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground mb-2">Proof document not available</p>
                <p className="text-sm text-muted-foreground">
                  The proof document URL is not available or invalid.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Profile;

