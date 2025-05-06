import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '@/lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { toast } from 'sonner';

const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState({ type: null, message: '' });

  const navigate = useNavigate();

  const handleReset = async () => {
    if (!email || !email.includes('@')) {
      setStatus({
        type: 'error',
        message: 'Please enter a valid email address'
      });
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setStatus({ type: null, message: '' });

    try {
      await sendPasswordResetEmail(auth, email);
      setStatus({
        type: 'success',
        message: 'Password reset email sent! Check your inbox.'
      });
      toast.success('Password reset email sent! Check your inbox.');
      setTimeout(() => {
        navigate('/login');
      }, 1500)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      setStatus({
        type: 'error',
        message: error.message || 'Failed to send reset email. Please try again.'
      });
      toast.error(error.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Reset Password</CardTitle>
          <CardDescription className="text-center">
            Enter your email address and we'll send you a link to reset your password
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
              />
            </div>
            
            {status.type && (
              <Alert className={status.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}>
                <div className="flex items-center gap-2">
                  {status.type === 'success' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription>{status.message}</AlertDescription>
                </div>
              </Alert>
            )}
            
            <Button 
              onClick={handleReset} 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </Button>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-center text-sm text-gray-500">
          <p>Remember your password? <Link to="/login" className="text-blue-600 hover:underline cursor-pointer">Sign in</Link></p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ResetPassword;