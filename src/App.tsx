import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import AuthGate from "@/components/AuthGate";


import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import Home from "./pages/Home";
import ProfileSetup from "./pages/ProfileSetup";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import MeetingScheduler from "./pages/MeetingScheduler";
import ProofUpload from "./pages/proofs/upload";
import ProofViewer from "./pages/ProofViewer";
import Rating from "./pages/Rating";
import Reels from "./pages/Reels";
import Notes from "./pages/Notes";
import NoteDetail from "./pages/NoteDetail";
import MyNotes from "./pages/MyNotes";
import SavedNotes from "./pages/SavedNotes";
import ConnectionSettings from "./pages/ConnectionSettings";
import AvailabilitySettings from "./pages/AvailabilitySettings";
import GroupDiscussion from "./pages/GroupDiscussion";
import GroupDetail from "./pages/GroupDetail";
import GroupMembers from "./pages/GroupMembers";
import News from "./pages/News";
import NewsDetail from "./pages/NewsDetail";
import FAQ from "./pages/FAQ";
import AboutUs from "./pages/AboutUs";
import Explore from "./pages/Explore";
import CommunityLeader from "./pages/CommunityLeader";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <ThemeProvider defaultTheme="dark" storageKey="swapx-theme">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Routes>
            {}
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/signup" element={<Signup />} />

            {}
            <Route
              path="/explore"
              element={<Explore />}
            />
            <Route
              path="/home"
              element={
                <AuthGate>
                  <Home />
                </AuthGate>
              }
            />
            <Route
              path="/profile/setup"
              element={<ProfileSetup />}
            />
            <Route
              path="/profile"
              element={
                <AuthGate>
                  <Profile />
                </AuthGate>
              }
            />
            <Route
              path="/profile/:id"
              element={
                <AuthGate>
                  <Profile />
                </AuthGate>
              }
            />
            <Route
              path="/dashboard"
              element={
                <AuthGate>
                  <Dashboard />
                </AuthGate>
              }
            />
            <Route
              path="/chat/:connectionId?"
              element={
                <AuthGate>
                  <Chat />
                </AuthGate>
              }
            />
            <Route
              path="/meeting/:id?"
              element={
                <AuthGate>
                  <MeetingScheduler />
                </AuthGate>
              }
            />
            <Route
              path="/reels"
              element={
                <AuthGate>
                  <Reels />
                </AuthGate>
              }
            />
            <Route
              path="/notes"
              element={
                <AuthGate>
                  <Notes />
                </AuthGate>
              }
            />
            <Route
              path="/notes/:id"
              element={
                <AuthGate>
                  <NoteDetail />
                </AuthGate>
              }
            />
            <Route
              path="/my-notes"
              element={
                <AuthGate>
                  <MyNotes />
                </AuthGate>
              }
            />
            <Route
              path="/saved-notes"
              element={
                <AuthGate>
                  <SavedNotes />
                </AuthGate>
              }
            />
            <Route
              path="/connection-settings"
              element={
                <AuthGate>
                  <ConnectionSettings />
                </AuthGate>
              }
            />
            <Route
              path="/availability"
              element={
                <AuthGate>
                  <AvailabilitySettings />
                </AuthGate>
              }
            />
            <Route
              path="/groups"
              element={
                <AuthGate>
                  <GroupDiscussion />
                </AuthGate>
              }
            />
            <Route
              path="/groups/:id"
              element={
                <AuthGate>
                  <GroupDetail />
                </AuthGate>
              }
            />
            <Route
              path="/groups/:id/members"
              element={
                <AuthGate>
                  <GroupMembers />
                </AuthGate>
              }
            />
            <Route
              path="/news"
              element={
                <AuthGate>
                  <News />
                </AuthGate>
              }
            />
            <Route
              path="/news/:id"
              element={
                <AuthGate>
                  <NewsDetail />
                </AuthGate>
              }
            />
            <Route
              path="/proofs/upload"
              element={
                <AuthGate>
                  <ProofUpload />
                </AuthGate>
              }
            />
            <Route
              path="/proof"
              element={
                <AuthGate>
                  <ProofViewer />
                </AuthGate>
              }
            />
            <Route
              path="/rate/:sessionId"
              element={
                <AuthGate>
                  <Rating />
                </AuthGate>
              }
            />
            <Route
              path="/faq"
              element={
                <AuthGate>
                  <FAQ />
                </AuthGate>
              }
            />
            <Route
              path="/about-us"
              element={
                <AuthGate>
                  <AboutUs />
                </AuthGate>
              }
            />
            <Route
              path="/community-leader"
              element={
                <AuthGate>
                  <CommunityLeader />
                </AuthGate>
              }
            />

            {}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
