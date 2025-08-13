import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ArrowDownToLine, CircleArrowLeft, GripVertical, HandHeart, Images, Trash2, Upload as UploadIcon } from "lucide-react";
import { RxOpenInNewWindow } from "react-icons/rx";
import { useNavigate } from "react-router-dom";
import SettingsSheet from "./Settings";
import { HiMiniQrCode } from "react-icons/hi2";
import { BsDownload } from "react-icons/bs";
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { getMediaBySpace, deleteMedia } from "@/services/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { getUserSpaceId, getSpaceById } from "@/services/api";


export default function Dashboard() {
  const navigate = useNavigate();
  const { spaceId } = useParams();
  const [showSettings, setShowSettings] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [mediaList, setMediaList] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const [eventDetails, setEventDetails] = useState<{ isPublic: boolean } | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const { currentUser } = useAuth();

  // Check if user has access to this space
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
            navigate(`/dashboard/${userSpaceId}`);
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
        console.log("Fetched event details:", data);
        setEventDetails({
          isPublic: !!data.isPublic,
        });
      } catch (err) {
        console.error("Error fetching event details:", err);
        setEventDetails({
          isPublic: false,
        });
      } finally {
        setLoadingEvent(false);
      }
    };
    fetchEventDetails();
  }, [spaceId]);

  useEffect(() => {
    const getMedia = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!spaceId) {
          throw new Error("Space ID is missing");
        }
        const media = await getMediaBySpace(spaceId);
        setMediaList(Array.isArray(media) ? media : []);
      } catch (err) {
        console.error("Error fetching media:", err);
        setError((err as Error).message || "Failed to load media. Please try again.");
        setMediaList([]);
      } finally {
        setLoading(false);
      }
    };
    if (spaceId) getMedia();
  }, [spaceId]);

  const handleUploadClick = () => {
    if (spaceId) {
      navigate(`/upload/${spaceId}`);
    }
  };

  // Download a specific image
  const handleImageDownload = async (src: string, index: number) => {
    try {
      const response = await fetch(src, { mode: "cors" });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `image-${index + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert("Failed to download image.");
    }
  };

  // Download all selected medias
  const handleImageDownloadSelected = async (src: string, index: number) => {
    try {
      const response = await fetch(src, { mode: "cors" });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `image-${index + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert("Failed to download image.");
    }
  };

  // The URL to encode in the QR code
  const uploadUrl = `${window.location.origin}/upload/${spaceId}`;
  // const uploadUrl = `${import.meta.env.VITE_FRONTEND_URL}/upload/${spaceId}`;

  // Download QR code as image
  const handleDownload = () => {
    const canvas = document.getElementById("event-qr-code");
    if (canvas) {
      const url = (canvas as HTMLCanvasElement).toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = "event-qrcode.png";
      a.click();
    }
  };

  // Open preview with media ID
  const openPreview = (url: string, mediaId: string) => {
    setPreviewImg(url);
    setSelectedMediaId(mediaId);
  };

  // Toggle selection for a media item
  const toggleSelectMedia = (mediaId: string) => {
    setSelectedMediaIds((prev) =>
      prev.includes(mediaId)
        ? prev.filter((id) => id !== mediaId)
        : [...prev, mediaId]
    );
  };

  // Delete all selected media items
  const handleDeleteSelected = async () => {
    if (!spaceId || selectedMediaIds.length === 0) return;
    try {
      await Promise.all(
        selectedMediaIds.map((mediaId) => deleteMedia(spaceId, mediaId))
      );
      setMediaList((prev) => prev.filter((item) => !selectedMediaIds.includes(item._id)));
      setSelectedMediaIds([]);
      toast.success("Selected media deleted successfully!");
      if (selectedMediaIds.includes(selectedMediaId ?? "")) {
        setPreviewImg(null);
        setSelectedMediaId(null);
      }
    } catch (err) {
      toast.error("Failed to delete selected media. Please try again.");
    }
  };

  // Delete a specific media item
  const handleDeleteMedia = async (mediaId: string) => {
    if (!spaceId) return;
    try {
      await deleteMedia(spaceId, mediaId);
      setMediaList((prev) => prev.filter((item) => item._id !== mediaId));
      toast.success(`Media deleted successfully!`);
      if (selectedMediaId === mediaId) {
        setPreviewImg(null);
        setSelectedMediaId(null);
      }
    } catch (err) {
      alert("Failed to delete media");
      toast.error("Failed to delete media. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      <Header
        spaceId={spaceId}
        onSettingsClick={currentUser ? () => setShowSettings(true) : undefined}
        isPublic={eventDetails?.isPublic}
      />

      <div
        className={`p-4 transition-all duration-300 ${
          showSettings ? "backdrop-blur-sm" : ""
        }`} 
      >
        <div className="justify-between flex">
          <CircleArrowLeft
            className="ml-10 mt-3 text-purple-400 hover:text-purple-300"
            onClick={handleUploadClick}
          />
          <div className="flex gap-4 items-center">
          {currentUser && (
            <Button
              size="sm"
              className={`flex flex-col items-center justify-center gap-2 p-5 mt-3 rounded-xl shadow-lg bg-purple-500 hover:bg-purple-400
                ${selectedMediaIds.length === 0 ? "mr-10" : ""}`}
              onClick={() => setShowQr(true)}
            >
              <div className="flex gap-2 items-center">
                <HiMiniQrCode />
                <span className="text-sm">Generate QRCode</span>
              </div>
            </Button>
          )}

          {selectedMediaIds.length > 0 && (
            <div className="">
              <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <GripVertical className="mt-3 mr-20 text-purple-400 cursor-pointer" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mr-4 cursor-pointer">
              {/* download */}
              <div className="flex items-center hover:bg-accent hover:rounded-sm"
                onClick={async () => {
                  await Promise.all(
                    selectedMediaIds.map(async (mediaId) => {
                      const media = mediaList.find(item => item._id === mediaId);
                      if (media && media.fileUrl) {
                        await handleImageDownloadSelected(media.fileUrl, mediaList.indexOf(media));
                      }
                    })
                  );
                  setSelectedMediaIds([]); // unselect all after download
                }}
              >
                <ArrowDownToLine className="ml-1 w-4 h-4" />
                <DropdownMenuLabel className="font-poppins font-thin">Download Media</DropdownMenuLabel>
              </div>
              <DropdownMenuSeparator />
              {/* delete */}
              <div className="flex items-center hover:bg-accent hover:rounded-sm" onClick={handleDeleteSelected}>
              <Trash2 className="ml-1 w-4 h-4" />
              <DropdownMenuLabel className="font-poppins font-thin">Delete Media</DropdownMenuLabel>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
            </div>
          )}
          </div>

          {showQr && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
                <h2 className="text-lg font-bold mb-4">
                  Scan to Upload Memories
                </h2>
                <QRCodeCanvas
                  id="event-qr-code"
                  value={uploadUrl}
                  size={220}
                  level="H"
                  includeMargin={true}
                />
                <div className="mt-4 flex gap-2">
                  <Button onClick={handleDownload}>Download QR Code</Button>
                  <Button variant="outline" onClick={() => setShowQr(false)}>
                    Close
                  </Button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground text-center">
                  Guests can scan this QR code to go directly to the upload
                  page.
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="p-4 mt-3" onClick={e => e.stopPropagation()}>
          {loading ? (
            <div className="flex justify-center items-center min-h-[40vh]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-purple-500"></div>
            </div>
          ) : mediaList.length === 0 ? (
            <div className="flex justify-center items-center min-h-[40vh]">
              <div className="max-w-2xl mx-auto text-center space-y-6">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-8 rounded-2xl shadow-lg border border-purple-100">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <UploadIcon className="w-4 h-4 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800">No Media Yet</h3>
                    <p className="text-gray-600 max-w-md text-sm">
                      Your gallery is ready to be filled with memories! To add media, you'll need to go back to the upload page.
                    </p>
                    <Button
                      size="sm"
                      className="flex items-center rounded-[8px] gap-2 px-6 py-3 bg-purple-500 hover:bg-purple-500 text-white text-sm rounded-xl shadow-lg transition-all duration-200"
                      onClick={handleUploadClick}
                    >
                      <Images className="w-5 h-5" />
                      Go to Upload Page
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 font-semibold text-sm">1</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">Navigate Back</h4>
                        <p className="text-sm text-gray-600">
                          Use the back arrow in the top-left corner to return to the upload page.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-green-600 font-semibold text-sm">2</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">Upload Media</h4>
                        <p className="text-sm text-gray-600">
                          Select and upload your photos and videos to start building your memory collection.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) 
          : (
            <div className="items-center justify-center pl-20 pr-20" onClick={e => e.stopPropagation()}>
              <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
                {mediaList.map((item, index) => (
                  <div
                    key={item._id}
                    className={`relative group break-inside-avoid rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 border-2 ${
                      selectedMediaIds.includes(item._id)
                        ? "border-purple-500"
                        : "border-transparent"
                    }`}
                    onClick={e => {
                      e.stopPropagation();
                      toggleSelectMedia(item._id);
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedMediaIds.includes(item._id)}
                      onChange={() => toggleSelectMedia(item._id)}
                      className="absolute top-2 left-2 z-10"
                      onClick={(e) => e.stopPropagation()}
                    />
                    {/* Check if src is a valid image or video URL */}
                    {item.fileUrl && /\.(jpe?g|png|gif|bmp|webp)$/i.test(item.fileUrl) ? (
                      <img
                        src={item.fileUrl}
                        alt={`Uploaded ${index}`}
                        className="w-full object-cover rounded-2xl"
                      />
                    ) : item.fileUrl && /\.(mp4|webm|ogg)$/i.test(item.fileUrl) ? (
                      <video
                        src={item.fileUrl}
                        controls
                        className="w-full object-cover rounded-2xl"
                      />
                    ) : (
                      <div className="w-full h-32 flex items-center justify-center bg-gray-100 text-gray-500">
                        <span>{`File ${index + 1}`}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <button
                        className="bg-white text-purple-600 px-4 py-2 rounded shadow-md mr-2 hover:bg-purple-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          openPreview(item.fileUrl, item._id);
                        }}
                      >
                        <RxOpenInNewWindow />
                      </button>
                      <button
                        className="bg-white text-purple-600 px-4 py-2 rounded shadow-md hover:bg-purple-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleImageDownload(item.fileUrl, index);
                        }}
                      >
                        <BsDownload />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
          }
        </div>
      </div>

      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <SettingsSheet 
            onClose={() => {
              setShowSettings(false);
              // Refresh event details to get updated mode
              if (spaceId) {
                getSpaceById(spaceId).then(data => {
                  setEventDetails({
                    isPublic: !!data.isPublic,
                  });
                }).catch(err => {
                  console.error("Error refreshing event details:", err);
                });
              }
            }} 
          />
        </div>
      )}
      {previewImg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white p-4 rounded-lg shadow-lg flex flex-col items-center">
            {/* Show image or video in preview */}
            {previewImg.match(/\.(mp4|webm|ogg)$/i) ? (
              <video src={previewImg} controls className="max-w-[80vw] max-h-[80vh] rounded-lg" />
            ) : (
              <img src={previewImg} alt="Preview" className="max-w-[80vw] max-h-[80vh] rounded-lg" />
            )}
            <div className="flex items-center gap-4">
              <button
                className="mt-4 px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-400"
                onClick={() => {
                  setPreviewImg(null);
                  setSelectedMediaId(null);
                }}
              >
                Close
              </button>
              {selectedMediaId && (
                <button
                  className="mt-4 px-6 py-2 bg-white-500 text-black rounded-lg border border-red-400 hover:bg-red-200"
                  onClick={() => handleDeleteMedia(selectedMediaId)}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}