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
import { createSpace } from '@/services/api';
import { useLocation } from 'react-router-dom';

import { IoLogoGoogle } from "react-icons/io";

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState<number>(1);
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
  };

  const nextStep = () => {
    if (step === 1) {
      // Validate first step
      if (!formData.firstName || !formData.lastName || !formData.partnerFirstName || !formData.partnerLastName) {
        toast.error("Please fill in all the name fields");
        return;
      }
    }
    
    if (step === 2) {
      // Validate second step
      if (!formData.email || !formData.password) {
        toast.error("Please provide a valid email and password");
        return;
      }
    }
    
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
      
      // Set the form data with Google account info
      setFormData(prev => ({
        ...prev,
        firstName,
        lastName,
        email: user.email || '',
      }));
      
      // Move to step 3 (event details) if we have the email
      if (user.email) {
        setStep(3);
        toast.success("Google sign-in successful! Please complete your event details.");
      }
    } catch (error) {
      console.error("Google sign-in error:", error);
      toast.error("Google sign-in failed. Please try again.");
    } finally {
      setIsLoading(false);
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
      
      // If not already signed in with Google, create account with email/password
      if (!auth.currentUser) {
        await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      }
      
      // Create space in MongoDB using our API
      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error("User authentication failed");
      }
      
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
                  <span className="text-xs text-muted-foreground">Account</span>
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
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input 
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Create a secure password"
                        value={formData.password}
                        onChange={handleChange}
                      />
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
                          className="flex-1"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        This will be your unique space URL
                      </p>
                    </div>
                    
                    <div className="pt-4 flex justify-between">
                      <Button type="button" variant="ghost" onClick={prevStep} disabled={isLoading}>
                        Back
                      </Button>
                      <Button type="submit" disabled={isLoading}>
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