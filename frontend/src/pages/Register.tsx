import React, { useEffect, useState } from 'react';
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
import { signInWithPopup, createUserWithEmailAndPassword } from 'firebase/auth';
import { createSpace, createUser, checkUrlSlugAvailability, getUserSpaceId } from '@/services/api';
import { useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

import { IoLogoGoogle } from "react-icons/io";

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState<number>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [slugStatus, setSlugStatus] = useState<{ available: boolean; message: string; suggestedSlug?: string } | null>(null);
  const [emailStatus, setEmailStatus] = useState<{ available: boolean; message: string } | null>(null);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    partnerFirstName: '',
    partnerLastName: '',
    email: '',
    password: '',
    eventDate: '',
    eventType: '',
    urlSlug: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Auto generate URL slug when names are entered
    if (['firstName', 'lastName', 'partnerFirstName', 'partnerLastName'].includes(name)) {
      const firstInitial = formData.firstName.charAt(0);
      const partnerInitial = formData.partnerFirstName.charAt(0);
      const currentYear = new Date().getFullYear();
      
      if (firstInitial && partnerInitial) {
        const generatedSlug = `${firstInitial}${partnerInitial}${currentYear}`;
        setFormData((prev) => ({ ...prev, urlSlug: generatedSlug.toLowerCase() }));
      }
    }
    
    // Check URL slug availability when urlSlug changes
    if (name === 'urlSlug' && value.trim()) {
      // Debounce the slug check to avoid too many API calls
      setTimeout(() => {
        checkSlugAvailability(value);
      }, 500);
    }

    // Check email availability when email changes
    if (name === 'email' && value.trim()) {
      checkEmailAvailability(value);
    }
  };

  // Check if URL slug is available
  const checkSlugAvailability = async (slug: string) => {
    if (!slug.trim()) {
      setSlugStatus(null);
      return;
    }
    
    setIsCheckingSlug(true);
    try {
      const result = await checkUrlSlugAvailability(slug);
      setSlugStatus(result);
    } catch (error) {
      console.error("Error checking slug availability:", error);
      setSlugStatus({ available: false, message: "Error checking availability" });
    } finally {
      setIsCheckingSlug(false);
    }
  };

  // Check if email is available (not used by another account)
  const checkEmailAvailability = async (email: string) => {
    if (!email.trim() || !email.includes('@')) {
      setEmailStatus(null);
      return;
    }
    
    // Don't check if it's the same as the Google account email
    if (auth.currentUser && auth.currentUser.providerData[0]?.providerId === 'google.com' && email === auth.currentUser.email) {
      setEmailStatus({ available: true, message: "Using your Google account email" });
      return;
    }
    
    setIsCheckingEmail(true);
    try {
      // For step-by-step validation, we only check email format, not database conflicts
      // Database conflicts will be checked during final submission
      if (email.includes('@') && email.includes('.')) {
        setEmailStatus({ available: true, message: "Email format is valid" });
      } else {
        setEmailStatus({ available: false, message: "Please enter a valid email address" });
      }
    } catch (error) {
      console.error("Error checking email availability:", error);
      setEmailStatus({ available: false, message: "Error checking availability" });
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const nextStep = async () => {
    if (step === 1) {
      // Validate first step
      if (!formData.firstName || !formData.lastName || !formData.partnerFirstName || !formData.partnerLastName) {
        toast.error("Please fill in all the name fields");
        return;
      }
    }
    
    if (step === 2) {
      // Always validate email field
      if (!formData.email || formData.email.trim() === '') {
        toast.error("Please provide a valid email address");
        return;
      }
      
      // Only validate email format, not database conflicts
      if (!formData.email.includes('@') || !formData.email.includes('.')) {
        toast.error("Please provide a valid email address");
        return;
      }
      
      // Only validate password if user is not signed in with Google
      if (!auth.currentUser || auth.currentUser.providerData[0]?.providerId !== 'google.com') {
        if (!formData.password || formData.password.trim() === '') {
          toast.error("Please provide a password");
          return;
        }
      }
    }
    
    if (step === 3) {
      // Validate third step
      if (!formData.eventDate || !formData.urlSlug) {
        toast.error("Please fill in all required fields");
        return;
      }
      
      // Check if URL slug is available
      if (slugStatus && !slugStatus.available) {
        toast.error("Please choose an available URL slug");
        return;
      }
      
      // If slug status is not checked yet, check it now
      if (!slugStatus) {
        try {
          const result = await checkUrlSlugAvailability(formData.urlSlug);
          if (!result.available) {
            setSlugStatus(result);
            toast.error("Please choose an available URL slug");
            return;
          }
        } catch (error) {
          toast.error("Error checking URL slug availability");
          return;
        }
      }
    }
    
    // Always go to next step (no more skipping step 2 for Google users)
    setStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setStep((prev) => prev - 1);
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Extract name from Google account
      const displayName = user.displayName || '';
      const nameParts = displayName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
      
      // Set the form data with Google account info, including email
      setFormData(prev => ({
        ...prev,
        firstName,
        lastName,
        email: user.email || '', // Pre-fill email but allow editing
      }));
      
      // Don't skip step 2 - let user review and edit all info including email
      toast.success("Google account connected! Email pre-filled but you can edit it.");
    } catch (error) {
      console.error("Google sign-in error:", error);
      toast.error("Google sign-in failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Check if there are any incomplete user registrations that might conflict
  const checkForIncompleteRegistrations = async () => {
    try {
      // Check if current user already has a space (indicating completed registration)
      if (auth.currentUser?.uid) {
        const existingSpace = await getUserSpaceId(auth.currentUser.uid);
        if (existingSpace) {
          console.log("User already has a space, registration completed previously");
          return { hasSpace: true, spaceId: existingSpace };
        }
      }
      return { hasSpace: false };
    } catch (error) {
      // No existing space found, which is expected for new registrations
      console.log("No existing space found, proceeding with new registration");
      return { hasSpace: false };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final validation
    if (!formData.eventDate || !formData.urlSlug) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    try {
      setIsLoading(true);
      
      // DEBUG: Log current authentication state
      // console.log("=== REGISTRATION DEBUG INFO ===");
      // console.log("Current auth state:", auth.currentUser);
      // console.log("Form email:", formData.email);
      // console.log("Form password length:", formData.password?.length || 0);
      // console.log("Current step:", step);
      // console.log("================================");
      
      // Check for incomplete registrations first
      const registrationStatus = await checkForIncompleteRegistrations();
      if (registrationStatus.hasSpace) {
        toast.info("You already have a memory space! Redirecting to your dashboard...");
        setTimeout(() => {
          navigate(`/dashboard/${registrationStatus.spaceId}`);
        }, 2000);
        return;
      }
      
      let userId = auth.currentUser?.uid;
      
      // IMPORTANT: Only create Firebase account if user is NOT already signed in
      // This prevents creating duplicate accounts during the registration process
      if (!userId) {
        // console.log("No existing user, creating new Firebase account");
        const result = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        userId = result.user.uid;
        // console.log("New Firebase user created with UID:", userId);
      } else {
        // console.log("User already signed in with UID:", userId);
        // User is signed in (likely with Google), check if they want to use a different email
        const currentEmail = auth.currentUser?.email;
        if (currentEmail && currentEmail !== formData.email) {
          // User wants to use a different email than their Google account
          // We'll use the form email for the database record, but keep the Google auth
          toast.info("Using different email than Google account. Your space will be created with the email you specified.");
        }
      }
      
      if (!userId) {
        throw new Error("User authentication failed");
      }
      
      console.log("Creating/updating user record in database with UID:", userId, "and email:", formData.email);
      
      // Create or update user record in our database
      try {
        await createUser({
          uid: userId,
          email: formData.email, // Use the email from the form (user's choice)
          displayName: `${formData.firstName} ${formData.lastName}`
        });
        console.log("User record created/updated successfully");
      } catch (error: any) {
        console.error("Error creating/updating user record:", error);
        
        // Handle email conflict errors specifically
        if (error.message && error.message.includes("already used by another account")) {
          toast.error("This email is already used by another account. Please use a different email or sign in with the existing account.");
          
          // If user is signed in with Google, suggest they use their Google email
          if (auth.currentUser && auth.currentUser.providerData[0]?.providerId === 'google.com') {
            toast.info("You can use your Google account email instead, or choose a different email address.");
          }
          
          // Stop the registration process
          return;
        }
        
        // Re-throw other errors
        throw error;
      }
      
      console.log("Creating memory space...");
      
      // Create space in MongoDB using our API
      const spaceData = {
        urlSlug: formData.urlSlug,
        userId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        partnerFirstName: formData.partnerFirstName,
        partnerLastName: formData.partnerLastName,
        eventDate: formData.eventDate,
        eventType: formData.eventType,
        isPublic: true, // Default to public
        plan: plan
      };
      
      const newSpace = await createSpace(spaceData);
      
      console.log("Memory space created successfully:", newSpace._id);
      
      // Show success toast
      toast.success("Space created successfully! Redirecting to your dashboard...");
      
      // Redirect to dashboard
      setTimeout(() => {
        navigate(`/upload/${newSpace._id}`); 
        // navigate(`/dashboard/${newSpace._id}`);
      }, 2000);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error(error.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Get plan from URL
const searchParams = new URLSearchParams(location.search);
const plan = searchParams.get('plan');

// Redirect if no plan is selected
useEffect(() => {
  if (!plan) {
    toast.error("Please select a plan before registering.");
    navigate("/pricing");
  }
}, [plan, navigate]);

// Check if user is already signed in with Google and populate their info
useEffect(() => {
  const user = auth.currentUser;
  if (user && user.providerData[0]?.providerId === 'google.com') {
    // User is signed in with Google, populate their name info
    const displayName = user.displayName || '';
    const nameParts = displayName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
    
    setFormData(prev => ({
      ...prev,
      firstName,
      lastName,
      // Don't auto-populate email - let user choose
    }));
    
    // Don't skip step 2 - let user review and edit all info
    toast.success("Google account connected! Please review and complete your information.");
  }
}, []);


  return (
    <div className="min-h-screen flex flex-col"> 
      <Header />
      
      <main className="flex-1 py-16 px-4">
        <div className="max-w-md mx-auto">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Create Your Memory Space</CardTitle>
              <CardDescription>
                Set up your shared space for collecting memories
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div className={`h-2 w-2 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`}></div>
                  <div className={`h-1 flex-1 ${step >= 2 ? 'bg-primary' : 'bg-muted'}`}></div>
                  <div className={`h-2 w-2 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`}></div>
                  <div className={`h-1 flex-1 ${step >= 3 ? 'bg-primary' : 'bg-muted'}`}></div>
                  <div className={`h-2 w-2 rounded-full ${step >= 3 ? 'bg-primary' : 'bg-muted'}`}></div>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-muted-foreground">Your Details</span>
                  <span className="text-xs text-muted-foreground">Account & Email</span>
                  <span className="text-xs text-muted-foreground">Event Info</span>
                </div>
              </div>
              
              <form onSubmit={handleSubmit}>
                {step === 1 && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">Your First Name</Label>
                        <Input 
                          id="firstName"
                          name="firstName"
                          placeholder="e.g., John"
                          value={formData.firstName}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Your Last Name</Label>
                        <Input 
                          id="lastName"
                          name="lastName"
                          placeholder="e.g., Smith"
                          value={formData.lastName}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="partnerFirstName">Partner's First Name</Label>
                        <Input 
                          id="partnerFirstName"
                          name="partnerFirstName"
                          placeholder="e.g., Jane"
                          value={formData.partnerFirstName}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="partnerLastName">Partner's Last Name</Label>
                        <Input 
                          id="partnerLastName"
                          name="partnerLastName"
                          placeholder="e.g., Doe"
                          value={formData.partnerLastName}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                    
                    <div className="pt-4">
                      <Button 
                        type="button" 
                        className="w-full" 
                        onClick={nextStep}
                        disabled={isLoading}
                      >
                        Continue
                      </Button>
                    </div>
                  </div>
                )}
                
                {step === 2 && (
                  <div className="space-y-4 animate-fade-in">
                                          <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <Input 
                            id="email"
                            name="email"
                            type="email"
                            placeholder="you@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            className={`${emailStatus && !emailStatus.available ? 'border-red-500' : formData.email && formData.email.includes('@') && formData.email.includes('.') ? 'border-green-500' : ''}`}
                          />
                          
                          {/* Show email availability status */}
                          {isCheckingEmail && (
                            <p className="text-xs text-muted-foreground flex items-center">
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-2"></div>
                              Checking email...
                            </p>
                          )}
                          
                          {emailStatus && !isCheckingEmail && (
                            <div className={`text-xs ${emailStatus.available ? 'text-green-600' : 'text-red-600'}`}>
                              {emailStatus.message}
                              {emailStatus.available && formData.email !== auth.currentUser?.email && (
                                <div className="text-muted-foreground mt-1">
                                  Note: Email availability will be checked during final submission
                                </div>
                              )}
                            </div>
                          )}
                          
                          {auth.currentUser && auth.currentUser.providerData[0]?.providerId === 'google.com' && (
                            <p className="text-xs text-muted-foreground">
                              Connected to Google account: {auth.currentUser.email}
                              <br />
                              <span className="text-blue-600">You can edit this email if you want to use a different one.</span>
                              <br />
                              <span className="text-orange-600">Note: If you choose a different email, make sure it's not already used by another account.</span>
                            </p>
                          )}
                        </div>
                    
                    {(!auth.currentUser || auth.currentUser.providerData[0]?.providerId !== 'google.com') && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="password">Password</Label>
                          <div className="relative">
                            <Input 
                              id="password"
                              name="password"
                              type={showPassword ? "text" : "password"}
                              placeholder="Create a secure password"
                              value={formData.password}
                              onChange={handleChange}
                            />
                            <button
                              type="button"
                              className="absolute inset-y-0 right-0 pr-3 flex items-center"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                            </button>
                          </div>
                        </div>
                        
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
                         <IoLogoGoogle className='w-6 h-6 mr-1' />
                          {isLoading ? 'Loading...' : 'Continue with Google'}
                        </Button>
                      </>
                    )}
                    
                    <div className="pt-4 flex justify-between">
                      <Button type="button" variant="ghost" onClick={prevStep} disabled={isLoading}>
                        Back
                      </Button>
                      <Button type="button" onClick={nextStep} disabled={isLoading}>
                        Continue
                      </Button>
                    </div>
                  </div>
                )}
                
                {step === 3 && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="space-y-2">
                      <Label htmlFor="eventDate">Event Date</Label>
                      <Input 
                        id="eventDate"
                        name="eventDate"
                        type="date"
                        value={formData.eventDate}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="urlSlug">Event Type</Label>
                      <div className="flex items-center">
                        <Input 
                          id="eventType"
                          name="eventType"
                          placeholder="e.g., Wedding"
                          value={formData.eventType}
                          onChange={handleChange}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="urlSlug">Custom URL</Label>
                      <div className="flex items-center">
                        <span className="text-muted-foreground mr-1">memoryshare.com/</span>
                        <Input 
                          id="urlSlug"
                          name="urlSlug"
                          placeholder="e.g., JS2025"
                          value={formData.urlSlug}
                          onChange={handleChange}
                          className={`flex-1 ${slugStatus && !slugStatus.available ? 'border-red-500' : slugStatus?.available ? 'border-green-500' : ''}`}
                        />
                      </div>
                      
                      {/* Show slug availability status */}
                      {isCheckingSlug && (
                        <p className="text-xs text-muted-foreground flex items-center">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-2"></div>
                          Checking availability...
                        </p>
                      )}
                      
                      {slugStatus && !isCheckingSlug && (
                        <div className={`text-xs ${slugStatus.available ? 'text-green-600' : 'text-red-600'}`}>
                          {slugStatus.message}
                          {!slugStatus.available && slugStatus.suggestedSlug && (
                            <div className="mt-1">
                              <span className="text-muted-foreground">Suggested: </span>
                              <button
                                type="button"
                                className="text-primary hover:underline font-medium"
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, urlSlug: slugStatus.suggestedSlug! }));
                                  setSlugStatus(null);
                                }}
                              >
                                {slugStatus.suggestedSlug}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <p className="text-xs text-muted-foreground">
                        This will be your unique space URL
                      </p>
                    </div>
                    
                    <div className="pt-4 flex justify-between">
                      <Button type="button" variant="ghost" onClick={prevStep} disabled={isLoading}>
                        Back
                      </Button>
                      <Button type="submit" disabled={isLoading || (slugStatus && !slugStatus.available)}>
                        {isLoading ? 'Creating...' : 'Create My Space'}
                      </Button>
                    </div>
                  </div>
                )}
              </form>
            </CardContent>
            
            <CardFooter className="flex justify-center border-t pt-4">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:underline">
                  Log in
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

export default Register;