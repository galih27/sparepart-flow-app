
'use client';

import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Point, Area } from 'react-easy-crop';
import { Slider } from '../ui/slider';

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedArea: Area, croppedAreaPixels: Area) => void;
}

export default function ImageCropper({ imageSrc, onCropComplete }: ImageCropperProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  const handleCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    onCropComplete(croppedArea, croppedAreaPixels);
  }, [onCropComplete]);

  return (
    <div className="relative w-full h-full">
      <Cropper
        image={imageSrc}
        crop={crop}
        zoom={zoom}
        aspect={1}
        onCropChange={setCrop}
        onZoomChange={setZoom}
        onCropComplete={handleCropComplete}
        cropShape="round"
        showGrid={false}
      />
      <div className="absolute bottom-4 left-4 right-4 z-10">
        <Slider
          value={[zoom]}
          min={1}
          max={3}
          step={0.1}
          onValueChange={(value) => setZoom(value[0])}
        />
      </div>
    </div>
  );
}
