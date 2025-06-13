import React, { useState, useRef } from "react";
import {
  Upload,
  X,
  FileText,
  Image,
  Music,
  Video,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";

const FileUpload = ({ onFileSelect, onUploadProgress, disabled = false }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const maxFileSize = 50 * 1024 * 1024; // 50MB
  const allowedTypes = {
    image: ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"],
    document: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
    audio: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/m4a"],
    video: ["video/mp4", "video/webm", "video/ogg", "video/avi", "video/mov"],
  };

  const getFileType = (file) => {
    if (allowedTypes.image.includes(file.type)) return "image";
    if (allowedTypes.document.includes(file.type)) return "document";
    if (allowedTypes.audio.includes(file.type)) return "audio";
    if (allowedTypes.video.includes(file.type)) return "video";
    return "unknown";
  };

  const getFileIcon = (type) => {
    switch (type) {
      case "image":
        return <Image className="w-4 h-4" />;
      case "document":
        return <FileText className="w-4 h-4" />;
      case "audio":
        return <Music className="w-4 h-4" />;
      case "video":
        return <Video className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const validateFile = (file) => {
    if (file.size > maxFileSize) {
      toast.error(
        `File size must be less than ${maxFileSize / (1024 * 1024)}MB`
      );
      return false;
    }

    const fileType = getFileType(file);
    if (fileType === "unknown") {
      toast.error("File type not supported");
      return false;
    }

    return true;
  };

  const handleFiles = (files) => {
    const fileArray = Array.from(files);

    for (const file of fileArray) {
      if (!validateFile(file)) {
        continue;
      }

      const fileType = getFileType(file);
      const fileData = {
        file,
        name: file.name,
        size: file.size,
        type: fileType,
        mimeType: file.type,
      };

      onFileSelect(fileData);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled || uploading) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleInputChange = (e) => {
    e.preventDefault();
    if (disabled || uploading) return;

    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.xls,.xlsx"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || uploading}
      />

      <div
        className={`
          relative border-2 border-dashed rounded-lg p-4 transition-colors cursor-pointer
          ${
            dragActive
              ? "border-blue-400 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }
          ${disabled || uploading ? "opacity-50 cursor-not-allowed" : ""}
        `}
        onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center space-y-2">
          <Upload
            className={`w-8 h-8 ${
              dragActive ? "text-blue-500" : "text-gray-400"
            }`}
          />
          <div className="text-sm text-center">
            <span className="font-medium">Click to upload</span> or drag and
            drop
          </div>
          <div className="text-xs text-gray-500 text-center">
            Images, documents, audio, video (max 50MB)
          </div>
        </div>

        {uploading && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-lg">
            <div className="w-full max-w-xs">
              <div className="text-sm text-gray-600 mb-2 text-center">
                Uploading...
              </div>
              <Progress value={uploadProgress} className="w-full" />
              <div className="text-xs text-gray-500 mt-1 text-center">
                {uploadProgress}%
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-2 text-xs text-gray-500">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="text-xs">
            <Image className="w-3 h-3 mr-1" />
            Images
          </Badge>
          <Badge variant="secondary" className="text-xs">
            <FileText className="w-3 h-3 mr-1" />
            Documents
          </Badge>
          <Badge variant="secondary" className="text-xs">
            <Music className="w-3 h-3 mr-1" />
            Audio
          </Badge>
          <Badge variant="secondary" className="text-xs">
            <Video className="w-3 h-3 mr-1" />
            Video
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
