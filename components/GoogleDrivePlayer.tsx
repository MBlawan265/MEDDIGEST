"use client";

interface GoogleDrivePlayerProps {
  driveId: string;
  className?: string;
}

export default function GoogleDrivePlayer({
  driveId,
  className = "",
}: GoogleDrivePlayerProps) {
  return (
    <div className={`relative w-full h-full bg-black ${className}`}>
      {/* Google Drive Video */}
      <iframe
        src={`https://drive.google.com/file/d/${driveId}/preview`}
        className="w-full h-full border-0"
        allow="autoplay; fullscreen"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
        allowFullScreen
        title="Course Video"
      />

      {/* Logo Overlay */}
      <div className="absolute top-3 right-3 z-20 pointer-events-none"></div>
      <div
        className="
    absolute top-0 right-0
    w-16 h-16
    z-30
    pointer-events-auto
  "
      >
        <img
          src="/logo.png"
          alt="Platform Logo"
          className="
      w-full h-full
      object-contain
      select-none
    "
        />
      </div>

    </div>
  );
}
