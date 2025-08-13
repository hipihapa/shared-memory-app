import '../index.css'
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../contexts/AuthContext";
import Index from "../pages/Index";
import Register from "../pages/Register";
import Login from "../pages/Login";
import Upload from "../pages/Upload";
import HowItWorks from "../pages/HowItWorks";
import Pricing from "../pages/Pricing";
import NotFound from "../pages/NotFound";
import Dashboard from "../pages/Dashboard";
import Settings from "../pages/Settings";
import ProtectedRoute from './ProtectedRoutes';
import PublicOnlyRoutes from './PublicOnlyRoutes';
import ResetPassword from '@/pages/ResetPassword';
import Payment from '@/pages/Payment';
import ScrollToTop from '@/components/ScrollToTop';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <ScrollToTop/>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route element={<PublicOnlyRoutes />}>
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ResetPassword />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/pricing" element={<Pricing />} />
            </Route>
            <Route element={<ProtectedRoute children={''}/>}>
              <Route path="/payment" element={<Payment />} />
              <Route path="/upload/:spaceId" element={<Upload />} />
              <Route path="/dashboard/:spaceId" element={<Dashboard />} />
              <Route path="dashboard/settings/:spaceId/" element={<Settings onClose={undefined} />} />
            </Route>


            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;