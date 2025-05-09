import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Camera, Upload as UploadIcon } from 'lucide-react';
import { useParams } from 'react-router-dom';
import Header from '@/components/layout/Header';
import { uploadMedia } from '@/services/api';

const Upload = () => {
  const { spaceId } = useParams<{ spaceId: string }>();
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [activeTab, setActiveTab] = useState<string>('upload');
  const [eventDetails, setEventDetails] = useState<{ name: string; date: string; mode: boolean } | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [isDragActive, setIsDragActive] = useState(false);

  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!spaceId) return;
      setLoadingEvent(true);
      try {
        const res = await fetch(`/api/spaces/id/${spaceId}`);
        if (!res.ok) throw new Error('Failed to fetch event details');
        const data = await res.json();
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prevFiles => [...prevFiles, ...selectedFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const handleCapturePhoto = () => {
    // In a real app, this would activate the device camera
    toast.info("Camera access would be requested here");
    setActiveTab('upload');
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("Please select at least one file to upload");
      return;
    }

    setIsUploading(true);

    try {
      const uploadPromises = files.map(file =>
        uploadMedia(spaceId, file, guestName || "Guest")
      );
      await Promise.all(uploadPromises);
      toast.success(`${files.length} files uploaded successfully. View in dashboard`);
      setFiles([]);
    } catch (error) {
      toast.error("Failed to upload files. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">

    <Header spaceId={spaceId} isPublic={eventDetails && !eventDetails.mode} />
      
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-4 sm:p-8">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-10">
          {loadingEvent ? (
            <div className="animate-pulse h-8 w-1/2 mx-auto bg-gray-200 rounded mb-2" />
          ) : (
            <>
              <h1 className="text-3xl font-bold mb-2">{eventDetails?.name}</h1>
              <p className="text-muted-foreground">{eventDetails?.date}</p>
              {eventDetails && (
                <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                  {eventDetails.mode ? (
                    <>
                      <span className="mr-1">Private Mode</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </>
                  ) : (
                    <>
                      <span className="mr-1">Public Mode</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
        
        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold">Share Your Memories</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Upload photos and videos from the event
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name(Optianal)</Label>
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
                        setFiles(prevFiles => [...prevFiles, ...droppedFiles]);
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
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6-6H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M18 8h-6V2"/><circle cx="10" cy="14" r="2"/><path d="m14 18-1-1-2 2-2-2-1 1"/></svg>
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
