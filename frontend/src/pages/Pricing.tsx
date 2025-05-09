
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const Pricing = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <section className="py-16 md:py-24 bg-purple-100">
          <div className="container max-w-6xl mx-auto px-6 text-center">
            <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that works best for your event
            </p>
          </div>
        </section>
        
        <section className="py-16">
          <div className="container max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {plans.map((plan, index) => (
                <Card key={index} className={`border-2 ${plan.highlight ? 'border-primary' : 'border-border'} shadow-lg`}>
                  <CardHeader>
                    {plan.highlight && (
                      <div className="py-1 px-3 bg-primary text-primary-foreground text-xs font-medium rounded-full mb-3 inline-block">
                        Most Popular
                      </div>
                    )}
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <span className="text-4xl font-bold">${plan.price}</span>
                      {plan.period && <span className="text-muted-foreground ml-2">{plan.period}</span>}
                    </div>
                    <ul className="space-y-3">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex">
                          <Check className="h-5 w-5 text-primary mr-3 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant={plan.highlight ? "default" : "outline"}
                      className="w-full"
                      asChild
                    >
                      <Link to={plan.ctaLink}>{plan.ctaText}</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
            
            <div className="mt-16 text-center">
              <p className="text-muted-foreground mb-3">
                All plans include our core features:
              </p>
              <div className="flex flex-wrap justify-center gap-x-8 gap-y-2">
                {[
                  "Free Guest Uploads", 
                  "QR Code Generation",
                  "Public/Private Mode", 
                  "Mobile-Friendly Interface"
                ].map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <Check className="h-4 w-4 text-primary mr-2" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        
        {/* FAQ Section */}
        <section className="py-16 md:py-24 bg-secondary/30">
          <div className="container max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Have questions about our plans? We're here to help.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-white p-6 rounded-xl shadow-sm">
                  <h3 className="text-lg font-semibold mb-3">{faq.question}</h3>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

const plans = [
  {
    name: "Basic",
    description: "Perfect for small gatherings",
    price: "0",
    period: "forever",
    features: [
      "10 media storage (50MB)",
      "2-months memory space access",
      "Basic photo organization",
      "Download individual photos"
    ],
    ctaText: "Get Started Free",
    ctaLink: "/register?plan=basic",
    highlight: false
  },
  {
    name: "Premium",
    description: "Best for weddings & large events",
    price: "20",
    period: "one-time",
    features: [
      "500 media storage (1GB)",
      "1-year memory space access",
      "Advanced organization",
      "Download individual photos"
    ],
    ctaText: "Choose Premium",
    // ctaLink: "/register?plan=premium",
    // ctaLink: "/payment?plan=premium",
    ctaLink: "/payment?plan=premium",
    highlight: true
  },
  {
    name: "Forever",
    description: "Permanent memory preservation",
    price: "50",
    period: "one-time",
    features: [
      "3000 media storage (5GB)",
      "Lifetime memory space access",
      "Priority support",
      "All Premium features",
      "Multiple media downloads"
    ],
    ctaText: "Choose Forever",
    // ctaLink: "/register?plan=forever",
    // ctaLink: "/payment?plan=forever",
    ctaLink: "/payment?plan=forever",
    highlight: false
  }
];

const faqs = [
  {
    question: "Can I upgrade my plan later?",
    answer: "Yes, you can upgrade from Basic to Premium or Forever plan at any time. Your existing photos and memories will be preserved during the upgrade."
  },
  {
    question: "What happens when my storage is full?",
    answer: "You'll receive a notification when you're approaching your storage limit. You can upgrade to a higher plan for more storage or manage your existing content."
  },
  {
    question: "Can I download all photos at once?",
    answer: "Bulk downloading is available on the Premium and Forever plans. The Basic plan allows downloading individual photos only."
  },
  {
    question: "What file types are supported?",
    answer: "Guests can upload standard photo (JPEG, PNG) and video (MP4, MOV) files. We optimize them while keeping quality intact."
  }
];

export default Pricing;
