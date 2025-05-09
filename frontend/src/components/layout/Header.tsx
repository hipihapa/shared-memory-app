
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { toast } from 'sonner';
import { useLocation } from 'react-router-dom';
import { Settings } from "lucide-react";

interface HeaderProps {
  userName?: string;
  onSettingsClick?: () => void;
  spaceId?: string;
  isPublic?: boolean; // <-- Add this line
}

const Header: React.FC<HeaderProps> = ({ userName = '', onSettingsClick, spaceId, isPublic }) => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Hide nav on login or register pages
  const hideNav = location.pathname === `/upload/${spaceId}` || location.pathname === `/dashboard/${spaceId}`;

  // Determine if guest (not logged in)
  const isGuest = !currentUser;

  // Determine if on upload or dashboard page
  const isUploadPage = location.pathname === `/upload/${spaceId}`;
  const isDashboardPage = location.pathname === `/dashboard/${spaceId}`;

  // Optionally, you can pass mode (public/private) as a prop or fetch it here if needed

  // Sign out handler
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success("Signed out successfully");
      navigate('/');
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Failed to sign out");
    }
  };

  return (
    <header className="w-full py-4 px-6 bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-10">
      <div className="container max-w-6xl mx-auto flex justify-between items-center">
        {currentUser ? (
          <span className="flex items-center cursor-default select-none">
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-purple-gradient">
              MemoryShare
            </span>
          </span>
        ) : (
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-purple-gradient">
              MemoryShare
            </span>
          </Link>
        )}

        {!hideNav && (
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/how-it-works" className="text-foreground hover:text-primary transition-colors">
              How It Works
            </Link>
            <Link to="/pricing" className="text-foreground hover:text-primary transition-colors">
              Pricing
            </Link>
          </nav>
        )}

        <div className="flex items-center space-x-4">
          {/* Authenticated user */}
          {currentUser && (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-muted-foreground hidden md:inline-block">
                Hello, {currentUser.displayName || userName || 'User'}
              </span>
              {/* Only show Dashboard button if not already on dashboard */}
              {location.pathname !== `/dashboard/${spaceId}` && spaceId && (
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/dashboard/${spaceId}`}>Dashboard</Link>
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          )}

          {/* Guest logic */}
          {!currentUser && (
            <>
              {/* On upload page: show nothing for private, only dashboard for public */}
              {isUploadPage && spaceId && (
                isPublic ? (
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/dashboard/${spaceId}`}>Dashboard</Link>
                  </Button>
                ) : null
              )}
              {/* On dashboard page: show nothing */}
              {isDashboardPage && null}
              {/* On other pages: show login/get started */}
              {!isUploadPage && !isDashboardPage && (
                <div className="flex items-center space-x-3">
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/login">Login</Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link to="/pricing">Get Started</Link>
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Show settings icon only for authenticated users on dashboard */}
          {currentUser && location.pathname === `/dashboard/${spaceId}` && spaceId && (
            <Button variant="ghost" size="icon" asChild={!onSettingsClick} onClick={onSettingsClick}>
              {onSettingsClick ? (
                <span aria-label="Settings">
                  <Settings className="w-5 h-5" />
                </span>
              ) : (
                <Link to={`/dashboard/settings/${spaceId}`} aria-label="Settings">
                  <Settings className="w-5 h-5" />
                </Link>
              )}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
