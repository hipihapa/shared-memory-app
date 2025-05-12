
import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { QrCode, Lock, LockOpen, Camera, Share } from 'lucide-react';
import { FaCheck } from "react-icons/fa6";

const HowItWorks = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-purple-100">
          <div className="container max-w-6xl mx-auto px-6 text-center">
            <h1 className="text-4xl font-bold mb-6">How MemoryShare Works</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A simple way to collect and share photos and videos from your special events.
            </p>
          </div>
        </section>
        
        {/* Steps Section */}
        <section className="py-16 md:py-24">
          <div className="container max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <div>
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-4">
                  Step 1
                </div>
                <h2 className="text-3xl font-bold mb-4">Create Your Memory Space</h2>
                <p className="text-muted-foreground mb-6">
                  Sign up to create your unique memory space. Just enter your names and event details, and we'll generate a custom URL for your event.
                </p>
                <ul className="space-y-3">
                  {[
                    'Quick signup with Google or email',
                    'Enter both partner names for a personalized space',
                    'Get a custom URL like FrankElla2025',
                    'Choose your privacy preferences',
                  ].map((item, index) => (
                    <li key={index} className="flex items-start">
                      <FaCheck className="h-5 w-5 text-primary mr-2 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-purple-100 p-8 rounded-2xl flex items-center justify-center">
                <Share className="w-32 h-32 text-primary/70" />
              </div>
            </div>
          </div>
        </section>
        
        {/* Step 2 */}
        <section className="py-16 md:py-24 bg-secondary/30">
          <div className="container max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <div className="order-last md:order-first bg-white p-8 rounded-2xl flex items-center justify-center shadow-md">
                <QrCode className="w-32 h-32 text-primary/70" />
              </div>
              <div>
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-4">
                  Step 2
                </div>
                <h2 className="text-3xl font-bold mb-4">Share Your QR Code</h2>
                <p className="text-muted-foreground mb-6">
                  We generate a unique QR code for your event. Share it with your guests by printing it for your event or sending it digitally.
                </p>
                <ul className="space-y-3">
                  {[
                    'QR code is automatically generated for your event',
                    'Print it for tables at your event',
                    'Include it on invitations or thank-you cards',
                    'Share digitally via text, email, or social media',
                  ].map((item, index) => (
                    <li key={index} className="flex items-start">
                      <FaCheck className="h-5 w-5 text-primary mr-2 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
        
        {/* Step 3 */}
        <section className="py-16 md:py-24">
          <div className="container max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <div>
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-4">
                  Step 3
                </div>
                <h2 className="text-3xl font-bold mb-4">Collect Memories From Guests</h2>
                <p className="text-muted-foreground mb-6">
                  Guests scan the QR code with their smartphone camera, which takes them directly to your upload page. No account creation needed!
                </p>
                <ul className="space-y-3">
                  {[
                    'Guests simply scan the QR code with their phone camera',
                    'No login or account creation required for guests',
                    'Guests enter their name and upload photos/videos',
                    'They can also take photos directly through the app',
                  ].map((item, index) => (
                    <li key={index} className="flex items-start">
                      <FaCheck className="h-5 w-5 text-primary mr-2 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-purple-100 p-8 rounded-2xl flex items-center justify-center">
                <Camera className="w-32 h-32 text-primary/70" />
              </div>
            </div>
          </div>
        </section>
        
        {/* Step 4 */}
        <section className="py-16 md:py-24 bg-secondary/30">
          <div className="container max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <div className="order-last md:order-first bg-white p-8 rounded-2xl flex items-center justify-center shadow-md">
                <div className="relative">
                  <Lock className="w-24 h-24 text-primary/70" />
                  <LockOpen className="w-24 h-24 text-primary/70 absolute top-0 left-12" />
                </div>
              </div>
              <div>
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-4">
                  Step 4
                </div>
                <h2 className="text-3xl font-bold mb-4">Control Your Privacy</h2>
                <p className="text-muted-foreground mb-6">
                  You control who can see the uploaded content. Choose between public mode where all guests can view uploads, or private mode where only you can see everything.
                </p>
                <ul className="space-y-3">
                  {[
                    'Public Mode: All guests can view all uploaded content',
                    'Private Mode: Only you can see all uploads',
                    'In private mode, guests only see their own uploads',
                    'Toggle between modes at any time',
                  ].map((item, index) => (
                    <li key={index} className="flex items-start">
                      <FaCheck className="h-5 w-5 text-primary mr-2 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
        
        {/* FAQ Section */}
        <section className="py-16 md:py-24">
          <div className="container max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold">Frequently Asked Questions</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-white p-6 rounded-xl shadow-sm">
                  <h3 className="text-lg font-semibold mb-3">{faq.question}</h3>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Call to action */}
        <section className="py-16 md:py-20 bg-primary">
          <div className="container max-w-6xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold mb-4 text-white">Ready to start collecting memories?</h2>
            <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              Create your memory space in minutes and start collecting photos and videos from your special event.
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/pricing">Create Your Memory Space</Link>
            </Button>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

const faqs = [
  {
    question: "Do guests need to create an account?",
    answer: "No, guests don't need to create an account. They simply scan the QR code, enter their name, and upload their photos or videos."
  },
  {
    question: "How many photos can be uploaded?",
    answer: "Our basic plan includes 50MB of storage, which is approximately 10 photos. Premium plans offer more storage options."
  },
  {
    question: "Can I download all photos at once?",
    answer: "Yes, you can download all photos as files from your dashboard. You can also select specific photos to download."
  },
  {
    question: "What types of files can be uploaded?",
    answer: "Guests can upload images (JPG, PNG, HEIC) and videos (MP4, MOV) up to 100MB per file."
  },
  {
    question: "How long will my memory space be available?",
    answer: "Your basic memory space will be available for 1 month after your event date. Premium plans offer extended or permanent storage options."
  },
  {
    question: "Can I remove inappropriate content?",
    answer: "Yes, as the host, you can review and delete any content from your memory space at any time."
  }
];

export default HowItWorks;
