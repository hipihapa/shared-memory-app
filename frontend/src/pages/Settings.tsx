import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CircleAlert, Lock, Unlock } from "lucide-react";
import React, { useState, useEffect } from "react";
import { updateSpaceMode, getSpaceById } from "@/services/api";
import { useParams } from "react-router-dom";

const Settings = ({ onClose }) => {
  const { spaceId } = useParams();
  const [publicMode, setPublicMode] = useState(false);
  const [privateMode, setPrivateMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [originalPublicMode, setOriginalPublicMode] = useState(false);

  // Load current mode from the backend
  const fetchMode = async () => {
    if (!spaceId) return;
    setLoading(true);
    try {
      const data = await getSpaceById(spaceId);
      const isPublic = !!data.isPublic;
      setPublicMode(isPublic);
      setPrivateMode(!isPublic);
      setOriginalPublicMode(isPublic);
    } catch (error) {
      console.error("Error fetching mode:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMode();
    // eslint-disable-next-line
  }, [spaceId]);

  // Save settings to backend
  const handleSave = async () => {
    if (!spaceId) return;
    try {
      setLoading(true);
      console.log("Saving mode:", { spaceId, publicMode });
      const result = await updateSpaceMode(spaceId, publicMode);
      console.log("Mode update result:", result);
      await fetchMode(); // Refresh state after save
      onClose();
    } catch (error) {
      console.error("Failed to update mode:", error);
      alert("Failed to update mode. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet
      open={true}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Permissions</SheetTitle>
          <SheetDescription>
            Make changes to your permissions here. Click save when you're done.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="flex justify-between">
            <HoverCard>
              <HoverCardTrigger asChild>
                <Label htmlFor="public-mode" className="cursor-pointer">
                  Public Mode
                </Label>
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <div className="flex justify-between space-x-4">
                  <Unlock className="w-6 h-6 text-green-500" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold">Public Mode</h4>
                    <p className="text-sm">
                      All guests can view uploads made by others.
                    </p>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
            <Switch
              id="public-mode"
              checked={publicMode}
              disabled={loading}
              onCheckedChange={(checked) => {
                setPublicMode(checked);
                if (checked) setPrivateMode(false);
              }}
            />
          </div>

          <div className="flex justify-between">
            <HoverCard>
              <HoverCardTrigger asChild>
                <Label htmlFor="private-mode" className="cursor-pointer">
                  Private Mode
                </Label>
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <div className="flex justify-between space-x-4">
                  <Lock className="w-10 h-10 text-red-500" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold">Private Mode</h4>
                    <p className="text-sm">
                      Only you can view all uploads, guests can upload but not view uploads.
                    </p>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
            <Switch
              id="private-mode"
              checked={privateMode}
              disabled={loading}
              onCheckedChange={(checked) => {
                setPrivateMode(checked);
                if (checked) setPublicMode(false);
              }}
            />
          </div>
        </div>
        <SheetFooter className="flex flex-col md:flex-row gap-y-2 md:gap-x-2">
          <Button type="submit" onClick={handleSave} disabled={loading}>Save changes</Button>
          <Button
            type="reset"
            className="bg-white text-black hover:bg-accent"
            disabled={loading}
            onClick={() => {
              setPublicMode(originalPublicMode);
              setPrivateMode(!originalPublicMode);
            }}
          >
            Cancel changes
          </Button>
        </SheetFooter>
        <div className="mt-6 flex items-center gap-2 bg-purple-100 p-2 border-2 border-purple-300 rounded-lg">
          <CircleAlert className="w-6 h-6 text-purple-400"/>
          <div>
            <p className="font-semibold text-sm">Did you know?</p>
            <p className="text-sm">You can hover on the modes to know more..</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default Settings;
