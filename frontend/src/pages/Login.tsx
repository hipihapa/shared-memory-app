
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup, signInWithEmailAndPassword, signInWithEmailLink } from 'firebase/auth';
import { getUserSpaceId, checkUserExists } from '@/services/api';
import { IoLogoGoogle } from 'react-icons/io5';
import { useAuth } from '@/contexts/AuthContext';

import { validateEmail } from '@/lib/utils';
import { EmailInput } from '@/components/ui/email-input';
import { PasswordInput } from '@/components/ui/password-input';

const Login = () => {
  const navigate = useNavigate();
  const { setVerifying } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [emailValidation, setEmailValidation] = useState<{ isValid: boolean; message: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Validate email in real-time
    if (name === 'email') {
      if (value.trim() === '') {
        setEmailValidation(null);
      } else {
        const validation = validateEmail(value);
        setEmailValidation(validation);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setVerifying(true); // Start verification process
      
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user exists in our database
      const userExists = await checkUserExists(user.uid);
      
      if (!userExists.exists) {
        toast.error("Account not found. Please sign up first.");
        // Sign out the user since they don't exist in our system
        await auth.signOut();
        // Redirect to registration page
        setTimeout(() => {
          navigate('/register');
        }, 2000);
        return;
      }
      
      toast.success("Google authentication successful! Redirecting to your gallery...");
      
      // Get user's space and redirect to dashboard
      const spaceId = await getUserSpaceId(user.uid);
      setTimeout(() => {
        navigate(`/dashboard/${spaceId}`);
      }, 2000);
    } catch (error) {
      console.error("Google sign-in error:", error);
      toast.error("Google sign-in failed. Please try again.");
    } finally {
      setIsLoading(false);
      setVerifying(false); // End verification process
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Enhanced validation with email validation
    if (!formData.email || !formData.password) {
      toast.error("Please enter your email and password");
      return;
    }
    
    // Validate email format before submission
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      toast.error(emailValidation.message);
      return;
    }
    
    try {
      setIsLoading(true);
      setVerifying(true); // Start verification process
      
      const result = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      const user = result.user;
      
      // Check if user exists in our database
      const userExists = await checkUserExists(user.uid);
      
      if (!userExists.exists) {
        toast.error("Account not found. Please sign up first.");
        // Sign out the user since they don't exist in our system
        await auth.signOut();
        // Redirect to registration page
        setTimeout(() => {
          navigate('/register');
        }, 2000);
        return;
      }
      
      toast.success("Login successful! Redirecting to your dashboard...");
      
      const spaceId = await getUserSpaceId(user.uid);
      setTimeout(() => {
        navigate(`/dashboard/${spaceId}`);
      }, 2000);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Login error:", error);
      
      // Handle specific Firebase auth errors
      if (error.code === 'auth/user-not-found') {
        toast.error("Account not found. Please sign up first.");
        // Redirect to registration page
        setTimeout(() => {
          navigate('/register');
        }, 3000);
      } else if (error.code === 'auth/wrong-password') {
        toast.error("Incorrect password. Please try again.");
      } else if (error.code === 'auth/invalid-email') {
        toast.error("Invalid email address.");
      } else {
        toast.error(error.message || "Login failed. Please check your credentials.");
      }
    } finally {
      setIsLoading(false);
      setVerifying(false); // End verification process
    }
  };

 
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-16 px-4">
        <div className="max-w-md mx-auto">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Welcome Back</CardTitle>
              <CardDescription>
                Log in to access your memory space. If you haven't signed up yet, please create an account first.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <EmailInput
                  id="email"
                  name="email"
                  label="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  onValidationChange={(isValid) => {
                    if (formData.email.trim() !== '') {
                      setEmailValidation({ isValid, message: isValid ? 'Email format is valid' : 'Invalid email format' });
                    }
                  }}
                />
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link to="/forgot-password" className="text-xs text-primary hover:underline cursor-pointer">
                      Forgot password?
                    </Link>
                  </div>
                  <PasswordInput
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    showStrength={false}
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Logging in...' : 'Log In'}
                </Button>
                
                <div className="flex items-center my-4">
                  <Separator className="flex-1" />
                  <span className="px-4 text-xs text-muted-foreground">or</span>
                  <Separator className="flex-1" />
                </div>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                >
                  <IoLogoGoogle className="w-6 h-6 mr-1" />
                  {isLoading ? 'Loading...' : 'Continue with Google'}
                </Button>
                
                {/* <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 text-center">
                    <strong>New to Memory Share?</strong> You need to create an account first before you can log in.
                  </p>
                </div> */}
              </form>
            </CardContent>
            
            <CardFooter className="flex justify-center border-t pt-4">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary hover:underline">
                  Sign up
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Login;
