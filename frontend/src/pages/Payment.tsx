import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, Banknote, Smartphone, ShieldCheck, CircleArrowLeft } from 'lucide-react';
import Header from '@/components/layout/Header';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useRef } from 'react';
import { initializePaystackPayment } from '@/services/api';

const planPrices = {
  basic: 0,
  premium: 10,
  forever: 30,
};

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [paymentMethod, setPaymentMethod] = useState('bank');
  const [mobileMoneyProvider, setMobileMoneyProvider] = useState('mtn');
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
//   const [accountName, setAccountName] = useState('');
  const [email, setEmail] = useState('');
//   const [bankName, setBankName] = useState('');
//   const [accountNumber, setAccountNumber] = useState('');
//   const [branchCode, setBranchCode] = useState('');
//   const [swiftCode, setSwiftCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [amountError, setAmountError] = useState('');

  const searchParams = new URLSearchParams(location.search);
  const plan = searchParams.get('plan') || 'basic';
  const minAmount = planPrices[plan] !== undefined ? planPrices[plan] : 0;

  const paystackScriptLoaded = useRef(false);

  // Load Paystack script once
  useEffect(() => {
    if (!paystackScriptLoaded.current) {
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      document.body.appendChild(script);
      paystackScriptLoaded.current = true;
    }
  }, []);

  // Replace handleSubmit with Paystack logic
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount < parseFloat(minAmountGHS))  {
      setAmountError(`Amount must be at least GHS ${minAmountGHS}`);
      toast.error(`Amount must be at least GHS ${minAmountGHS}`);
      return;
    }
    setAmountError('');
    setIsProcessing(true);

    // 1. Initialize Paystack payment via backend
    const paymentData = {
      email,
      amount: Math.round(numericAmount * 100), // Paystack expects amount in pesewas
      currency: 'GHS',
      plan,
      paymentMethod, // <-- Add this
      ...(paymentMethod === 'mobile' && {
        phone,
        provider: mobileMoneyProvider, // <-- Add this for mobile money
      }),
    };

    try {
      const { authorization_url, reference } = await initializePaystackPayment(paymentData);
      window.location.href = authorization_url;
    } catch (error) {
      setIsProcessing(false);
      toast.error('Payment initialization failed. Please try again.');
      console.error('Payment error:', error);
    }
  };

  // Example: After redirect, verify payment (in useEffect)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get('reference');
    if (reference) {
      setIsProcessing(true);
      fetch(`/api/verify-payment?reference=${reference}`, {
        method: 'GET',
        credentials: 'include',
      })
        .then(res => res.json())
        .then(data => {
          setIsProcessing(false);
          if (data.status === 'success') {
            setIsComplete(true);
            toast.success('Payment verified successfully!');
          } else {
            toast.error('Payment verification failed.');
          }
        })
        .catch(() => {
          setIsProcessing(false);
          toast.error('Error verifying payment.');
        });
    }
  }, []);

  const [usdToGhsRate, setUsdToGhsRate] = useState(null);
  const [rateError, setRateError] = useState('');

  // Fetch exchange rate on mount
  useEffect(() => {
    async function fetchRate() {
      try {
        // exchangerate api for currency conversion for payment amount placeholder 
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await res.json();
        if (data && data.rates && data.rates.GHS) {
          setUsdToGhsRate(data.rates.GHS);
        } else {
          setRateError('Could not fetch exchange rate.');
        }
      } catch (err) {
        setRateError('Could not fetch exchange rate.');
      }
    }
    fetchRate();
  }, []);

  const minAmountGHS = usdToGhsRate ? (minAmount * usdToGhsRate).toFixed(2) : '';

  //   const handleBackClick = () => {
  //     navigate("/");
  //   };
  
  //   space creating
    const handleSpaceClick = () => {
      navigate("/");
    };
  
    const bankPlaceholders = {
      bankName: 'eg., CalBank',
      accountNumber: '083****9999',
      accountName: 'Your Full Name',
      branchName: 'East Legon',
    };
  
    if (isComplete) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 bg-green-100 p-2 rounded-full w-12 h-12 flex items-center justify-center">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-xl font-bold">Payment Successful!</CardTitle>
              <CardDescription>
                Thank you for your payment. A confirmation has been sent to your email.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button className="w-full" onClick={handleSpaceClick}>
                Go Back Home
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }
  
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        {/* <CircleArrowLeft
          className="ml-20 mt-3 text-purple-400 hover:text-purple-300"
          onClick={handleBackClick}
        /> */}
        <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Complete Your Payment</CardTitle>
              <CardDescription>
                {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan &mdash; Minimum: USD {minAmount}
                {usdToGhsRate && (
                  <span> ≈ GHS {minAmountGHS}</span>
                )}
              </CardDescription>
            </CardHeader>
  
            <CardContent className="space-y-6">
              {/* Payment Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">Payment Amount (GHS)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder={minAmountGHS || 'Loading...'}
                  required
                  value={amount}
                  min={minAmountGHS}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setAmountError('');
                  }}
                  disabled={!usdToGhsRate}
                />
                {rateError && (
                  <p className="text-xs text-red-600">{rateError}</p>
                )}
                {amountError && (
                  <p className="text-xs text-red-600">{amountError}</p>
                )}
              </div>
  
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
  
              {/* Payment Method Selection */}
              <div className="space-y-2">
                <Label>Select Payment Method</Label>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
                  className="grid grid-cols-2 gap-4"
                >
                  <div>
                    <RadioGroupItem value="bank" id="bank" className="peer sr-only" />
                    <Label
                      htmlFor="bank"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary"
                    >
                      <Banknote className="mb-3 h-6 w-6" />
                      Bank Transfer
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="mobile" id="mobile" className="peer sr-only" />
                    <Label
                      htmlFor="mobile"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary"
                    >
                      <Smartphone className="mb-3 h-6 w-6" />
                      Mobile Money
                    </Label>
                  </div>
                </RadioGroup>
              </div>
  
              {/* Bank Transfer Details */}
              {/* {paymentMethod === 'bank' && (
                <div className="space-y-4 rounded-md border p-4">
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input
                      id="bankName"
                      placeholder={bankPlaceholders.bankName}
                      required
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input
                      id="accountNumber"
                      placeholder={bankPlaceholders.accountNumber}
                      required
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountName">Account Name</Label>
                    <Input
                      id="accountName"
                      placeholder={bankPlaceholders.accountName}
                      required
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="branchCode">Branch Code (Optional)</Label>
                    <Input
                      id="branchCode"
                      placeholder={bankPlaceholders.branchName}
                      value={branchCode}
                      onChange={(e) => setBranchCode(e.target.value)}
                    />
                  </div>
                  <div className="pt-2">
                    <p className="text-xs text-muted-foreground">
                      Please ensure all bank details are entered correctly. Your name will be included as the reference for the transfer.
                    </p>
                  </div>
                </div>
              )} */}
  
              {/* Mobile Money Options */}
              {/* {paymentMethod === 'mobile' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="mobileMoneyProvider">Select Provider</Label>
                    <Select
                      value={mobileMoneyProvider}
                      onValueChange={setMobileMoneyProvider}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mtn">MTN Mobile Money</SelectItem>
                        <SelectItem value="vodafone">Vodafone Cash</SelectItem>
                        <SelectItem value="airteltigo">AirtelTigo Money</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Mobile Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="0XX XXX XXXX"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
  
                  {mobileMoneyProvider === 'mtn' && (
                    <Alert>
                      <Smartphone className="h-4 w-4" />
                      <AlertTitle>MTN Mobile Money</AlertTitle>
                      <AlertDescription>
                        Dial *170# on your phone to authorize the payment after submission.
                      </AlertDescription>
                    </Alert>
                  )}
                  {mobileMoneyProvider === 'vodafone' && (
                    <Alert>
                      <Smartphone className="h-4 w-4" />
                      <AlertTitle>Vodafone Cash</AlertTitle>
                      <AlertDescription>
                        Dial *110# on your phone to authorize the payment after submission.
                      </AlertDescription>
                    </Alert>
                  )}
                  {mobileMoneyProvider === 'airteltigo' && (
                    <Alert>
                      <Smartphone className="h-4 w-4" />
                      <AlertTitle>AirtelTigo Money</AlertTitle>
                      <AlertDescription>
                        Dial *500# on your phone to authorize the payment after submission.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )} */}
  
              <div className="flex items-center space-x-2 pt-2">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                <span className="text-xs text-muted-foreground">Your payment information is secure and encrypted</span>
              </div>
            </CardContent>
  
            <CardFooter className="flex flex-col gap-4">
              <Button
                onClick={handleSubmit}
                className="w-full"
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Complete Payment'}
              </Button>
              <div className="text-xs text-center text-muted-foreground">
                By completing this payment, you agree to our Terms of Service and Privacy Policy
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
};

export default Payment;



