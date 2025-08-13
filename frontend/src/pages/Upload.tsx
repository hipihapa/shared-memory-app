import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Camera, Upload as UploadIcon } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import { uploadMedia } from '@/services/api';
import { getUserSpaceId, getSpaceById, getMediaBySpace } from '@/services/api';

import { CiLock } from "react-icons/ci";
import { CiUnlock } from "react-icons/ci";
import { FaFileImage } from "react-icons/fa";
import { useAuth } from '@/contexts/AuthContext';
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../store";
import { addFiles, removeFile, clearFiles } from "@/store/slices/uploadFileSlice";

const Upload = () => {
  const { spaceId } = useParams<{ spaceId: string }>();
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [activeTab, setActiveTab] = useState<string>('upload');
  const [eventDetails, setEventDetails] = useState<{ name: string; date: string; mode: boolean } | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [isDragActive, setIsDragActive] = useState(false);
  const { currentUser } = useAuth();

  // Check if user has access to this space (only for authenticated users)
  useEffect(() => {
    const checkUserAccess = async () => {
      if (!currentUser || !spaceId) return;
      
      try {
        // Try to get the user's space ID to verify access
        const userSpaceId = await getUserSpaceId(currentUser.uid);
        // If the user's space ID doesn't match the current spaceId, redirect
        if (userSpaceId !== spaceId) {
          toast.error("You don't have access to this space. Redirecting to your space...");
          setTimeout(() => {
            navigate(`/upload/${userSpaceId}`);
          }, 2000);
        }
      } catch (error) {
        console.error("Error checking user access:", error);
        // User doesn't have a space, redirect to registration
        toast.error("You haven't created a space yet. Please complete your registration first.");
        setTimeout(() => {
          navigate('/register');
        }, 2000);
      }
    };

    checkUserAccess();
  }, [currentUser, spaceId, navigate]);

  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!spaceId) return;
      setLoadingEvent(true);
      try {
        const data = await getSpaceById(spaceId);
        setEventDetails({
          name: `${data.urlSlug}`,
          date: new Date(data.eventDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }),
          mode: !data.isPublic,
        });
      } catch (err) {
        setEventDetails({
          name: 'Name Not Found',
          date: '', 
          mode: false,
        });
      } finally {
        setLoadingEvent(false);
      }
    };
    fetchEventDetails();
  }, [spaceId]);

  const [mediaCount, setMediaCount] = useState<number>(0);
  const [maxAllowed, setMaxAllowed] = useState<number>(10); // default to basic
  const [quotaLoading, setQuotaLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchQuota = async () => {
      if (!spaceId) return;
      setQuotaLoading(true);
      try {
        // Fetch space details to get plan
        const data = await getSpaceById(spaceId);
        const plan = data.plan || 'basic';
        let max = 10;
        if (plan === 'premium') max = 500;
        else if (plan === 'forever') max = 3000;
        setMaxAllowed(max);

        // Fetch current media count
        const mediaData = await getMediaBySpace(spaceId);
        setMediaCount(mediaData.length || 0);
      } catch (err) {
        setMediaCount(0);
        setMaxAllowed(10);
      } finally {
        setQuotaLoading(false);
      }
    };
    fetchQuota();
  }, [spaceId]);

  const remainingQuota = maxAllowed - mediaCount;

  const dispatch = useDispatch();
  const files = useSelector((state: RootState) => state.uploadFiles.files);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      let allowedFiles: File[] = [];
      // Prevent selecting more than remaining quota
      if (selectedFiles.length + files.length > remainingQuota) {
        toast.warning(
          `You can only upload ${remainingQuota} more file(s) for this space.`
        );
        // Only allow up to the quota
        allowedFiles = selectedFiles.slice(0, remainingQuota - files.length);
      } else {
        allowedFiles = selectedFiles;
      }
      if (allowedFiles.length > 0) {
        dispatch(addFiles(allowedFiles));
      }
    }
  };

  const handleRemoveFile = (index: number) => {
    dispatch(removeFile(index));
  };

  const handleClearFiles = () => {
    dispatch(clearFiles());
  };

  const handleCapturePhoto = () => {
    // todo: i will fix this later to activate the device camera
    toast.info("Camera access would be requested here");
    setActiveTab('upload');
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("Please select at least one file to upload");
      return;
    }
    if (files.length > remainingQuota) {
      toast.error(`You can only upload ${remainingQuota} more file(s) for this space.`);
      return;
    }

    // filtering out files that are not images or videos
    const validFiles = files.filter(file => file.type.startsWith('image/') || file.type.startsWith('video/'));

    if (validFiles.length === 0) {
      toast.error("Only image and video files are allowed");
      return;
    }
    if (validFiles.length < files.length) {
      toast.warning("Some files were not images or videos and were skipped");
      dispatch(clearFiles());
      dispatch(addFiles(validFiles));
    }

    setIsUploading(true);

    try {
      // Upload only validFiles, not files
      const uploadPromises = validFiles.map(file =>
        uploadMedia(spaceId, file, guestName || "Guest")
      );
      await Promise.all(uploadPromises);
      toast.success(`${validFiles.length} files uploaded successfully. View in dashboard`);
      // setFiles([]);
      dispatch(clearFiles());
    } catch (error) {
      toast.error("Failed to upload files. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">

    <Header spaceId={spaceId} isPublic={eventDetails && !eventDetails.mode} />
      
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-2 sm:p-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-4">
          {loadingEvent ? (
            <>
            <div className="animate-pulse h-8 w-1/2 mx-auto bg-gray-200 rounded-lg mb-2" />
            <div className="animate-pulse h-4 w-1/2 mx-auto bg-gray-200 rounded-lg mb-3" />
            <div className="animate-pulse h-6 w-1/2 mx-auto bg-gray-200 rounded-lg mb-2" />
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold mb-2">{eventDetails?.name}</h1>
              <p className="text-muted-foreground">{eventDetails?.date}</p>
              {/* Only show mode badge if user is authenticated */}
              {eventDetails && currentUser && (
                <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                  {eventDetails.mode ? (
                    <>
                      <span className="mr-1">Private Mode</span>
                      <CiLock className='w-6 h-5 text-bold text-primary' />
                    </>
                  ) : (
                    <>
                      <span className="mr-1">Public Mode</span>
                      <CiUnlock className='w-6 h-5 text-bold text-primary' />
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
        
        <Card className="border-none shadow-lg">
          <CardContent className="px-6 py-2">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold">Share Your Memories</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Upload photos and videos from the event
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name(Optional)</Label>
                <Input 
                  id="name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="e.g., Alex Smith"
                />
              </div>
              
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-2 mb-4">
                  <TabsTrigger value="upload">Upload Media</TabsTrigger>
                  <TabsTrigger value="capture">Take Photo</TabsTrigger>
                </TabsList>
                
                <TabsContent value="upload" className="space-y-4">
                  <div 
                    className={`border-2 border-dashed border-primary/20 rounded-lg p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer ${
                      isDragActive ? 'bg-primary/10' : 'hover:bg-primary/5'
                    }`}
                    onClick={() => document.getElementById('file-upload')?.click()}
                    onDragOver={e => {
                      e.preventDefault();
                      setIsDragActive(true);
                    }}
                    onDragLeave={e => {
                      e.preventDefault();
                      setIsDragActive(false);
                    }}
                    onDrop={e => {
                      e.preventDefault();
                      setIsDragActive(false);
                      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
                        const droppedFiles = Array.from(e.dataTransfer.files);
                        let allowedFiles: File[] = [];
                        if (droppedFiles.length + files.length > remainingQuota) {
                          toast.warning(
                            `You can only upload ${remainingQuota} more file(s) for this space.`
                          );
                          allowedFiles = droppedFiles.slice(0, remainingQuota - files.length);
                        } else {
                          allowedFiles = droppedFiles;
                        }
                        if (allowedFiles.length > 0) {
                          dispatch(addFiles(allowedFiles));
                        }
                      }
                    }}
                  >
                    <UploadIcon className="h-10 w-10 text-primary/60 mb-4" />
                    <p className="text-sm font-medium">Drag photos here or click to browse</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Support for images and videos
                    </p>
                    <input 
                      id="file-upload" 
                      type="file" 
                      accept="image/*,video/*" 
                      multiple 
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="capture" className="space-y-4">
                  <div className="border-2 border-dashed border-primary/20 rounded-lg p-8 flex flex-col items-center justify-center text-center hover:bg-primary/5 transition-colors cursor-pointer"
                    onClick={handleCapturePhoto}
                  >
                    <Camera className="h-10 w-10 text-primary/60 mb-4" />
                    <p className="text-sm font-medium">Tap to take a photo</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Uses your device camera
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
              
              {files.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium">{files.length} file(s) selected</p>
                  <div className="grid grid-cols-3 gap-2">
                    {files.map((file, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-md bg-muted overflow-hidden">
                          {file.type.startsWith('image/') ? (
                            <img 
                              src={URL.createObjectURL(file)} 
                              alt={`Preview ${index}`}
                              className="w-full h-full object-cover"
                            />
                          ) : file.type.startsWith('video/') ? (
                            <video
                              src={URL.createObjectURL(file)}
                              controls
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                              <FaFileImage className='w-10 h-10' />
                            </div>
                          )}
                        </div>
                        <button 
                          onClick={() => handleRemoveFile(index)}
                          className="absolute -top-1 -right-1 bg-destructive text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <Button 
                onClick={handleUpload} 
                className="w-full" 
                disabled={isUploading || files.length === 0}
              >
                {isUploading ? 'Uploading...' : 'Upload Photos'}
              </Button>
              
              <p className="text-xs text-center text-muted-foreground mt-4">
                By uploading, you agree that these photos may be viewed by the event hosts
                {eventDetails && !eventDetails.mode && ' and other guests'}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Powered by <span className="font-medium">MemoryShare</span>
          </p>
        </div>
      </div>
    </div>
    </div>
  );
};

export default Upload;
