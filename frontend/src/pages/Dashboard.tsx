import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { CircleArrowLeft, Upload as UploadIcon } from "lucide-react";
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

  useEffect(() => {
    const getMedia = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!spaceId) {
          throw new Error("Space ID is missing");
        }
        const media = await getMediaBySpace(spaceId);
        setMediaList(media); // Store full media objects
      } catch (err) {
        console.error("Error fetching media:", err);
        setError(err.message || "Failed to load media. Please try again.");
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
  const handleImageDownload = (src: string, index: number) => {
    const link = document.createElement("a");
    link.href = src;
    link.download = `image-${index + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // The URL to encode in the QR code
  const uploadUrl = `${window.location.origin}/upload/${spaceId}`;

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
        onSettingsClick={() => setShowSettings(true)}
      />

      <div
        className={`p-4 transition-all duration-300 ${
          showSettings ? "backdrop-blur-sm" : ""
        }`}
      >
        <div className="justify-between flex">
          <CircleArrowLeft
            className="ml-20 mt-3 text-purple-400 hover:text-purple-300"
            onClick={handleUploadClick}
          />
          <Button
            size="sm"
            className="flex flex-col items-center justify-center gap-2 p-5 mr-20 mt-3 rounded-xl shadow-lg bg-purple-500 hover:bg-purple-400"
            onClick={() => setShowQr(true)}
          >
            <div className="flex gap-2 items-center">
              <HiMiniQrCode />
              <span className="text-sm">Generate QRCode</span>
            </div>
          </Button>

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
        <div className="p-4 mt-3">
          {loading ? (
            <div className="text-center text-muted-foreground">Loading...</div>
          ) : mediaList.length === 0 ? (
            <div className="flex justify-center items-center min-h-[40vh]">
              <Button
                size="lg"
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl shadow-lg"
                onClick={handleUploadClick}
              >
                <div className="flex items-center justify-center gap-2">
                  <UploadIcon className="w-12 h-12" />
                  <span className="text-sm">Upload Media</span>
                </div>
              </Button>
            </div>
          ) : (
            <div className="items-center justify-center pl-20 pr-20">
              <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
                {mediaList.map((item, index) => (
                  <div
                    key={item._id}
                    className="relative group break-inside-avoid rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300"
                  >
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
                        onClick={() => openPreview(item.fileUrl, item._id)}
                      >
                        <RxOpenInNewWindow />
                      </button>
                      <button
                        className="bg-white text-purple-600 px-4 py-2 rounded shadow-md hover:bg-purple-100"
                        onClick={() => handleImageDownload(item.fileUrl, index)}
                      >
                        <BsDownload />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <SettingsSheet onClose={() => setShowSettings(false)} />
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