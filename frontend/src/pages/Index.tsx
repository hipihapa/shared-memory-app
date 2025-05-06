
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getUserSpaceId } from '@/services/api';
import { Button } from '@/components/ui/button';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { QrCode, Share, Camera } from 'lucide-react';

import homeImg from "../assets/home-img.jpeg";
import { toast } from 'sonner';



const Index = () => {
  const { currentUser, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && currentUser) {
      // Fetch the user's spaceId and redirect
      getUserSpaceId(currentUser.uid)
        .then((spaceId) => {
          if (spaceId) {
            navigate(`/dashboard/${spaceId}`);
          }
        })
        .catch((error) => {
          console.error("Redirection error:", error);
          toast.error("Failed to load your dashboard. Please try again.");
        });
    }
  }, [currentUser, isLoading, navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-purple-100 -z-10"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-300 rounded-full blur-3xl opacity-20 -z-10"></div>
        
        <div className="container max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 animate-fade-in">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Capture & Share <br />
                <span className="bg-clip-text text-transparent bg-purple-gradient">
                  Event Memories
                </span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-md">
                Create a shared space where all your guests can upload their photos and videos from your special day. No accounts needed for guests.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild>
                  <Link to="/register">Create Your Space</Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/how-it-works">How It Works</Link>
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-xl animate-fade-in">
                <img 
                  // src="../assets/home-img.jpeg" 
                  src={homeImg} 
                  alt="Wedding photo collage" 
                  className="w-full h-auto"
                  style={{ minHeight: "350px" }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end p-8">
                  <div className="text-white">
                    <p className="font-semibold text-xl">Shaza & Andrew</p>
                    <p>September 2025</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="container max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Easy memory sharing in three simple steps
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="memory-card border-none shadow-md bg-white">
                <CardContent className="p-8">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-xl mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      {/* Use Cases */}
      <section className="py-16 md:py-24 bg-secondary/50">
        <div className="container max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Perfect For All Special Occasions</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Create unforgettable memories for any event
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {occasions.map((occasion, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-sm memory-card">
                <h3 className="font-semibold text-lg mb-2">{occasion.title}</h3>
                <p className="text-muted-foreground text-sm">{occasion.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Call to action */}
      <section className="py-16 md:py-20 bg-primary">
        <div className="container max-w-6xl mx-auto px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-6 text-white">Ready to create your memory space?</h2>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/register">Get Started — It's Free</Link>
            </Button>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

const features = [
  {
    title: "Create Your Space",
    description: "Sign up and create a unique digital space for your event with a custom URL.",
    icon: Share,
  },
  {
    title: "Share Your QR Code",
    description: "Share the QR code with your guests so they can easily upload photos and videos.",
    icon: QrCode,
  },
  {
    title: "Collect Memories",
    description: "Guests can upload media without signing up, and you control who can view them.",
    icon: Camera,
  },
];

const occasions = [
  {
    title: "Weddings",
    description: "Collect candid moments from your special day that professional photographers might miss."
  },
  {
    title: "Birthday Parties",
    description: "Gather all the fun moments from your celebration in one place."
  },
  {
    title: "Family Reunions",
    description: "Create a shared album of memories from everyone in the family."
  },
  {
    title: "Corporate Events",
    description: "Collect photos from team building activities and company celebrations."
  },
  {
    title: "Baby Showers",
    description: "Capture all the special moments as you welcome your little one."
  },
  {
    title: "Graduation Parties",
    description: "Celebrate achievements with photos from friends and family."
  },
];

export default Index;
