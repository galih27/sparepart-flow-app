
"use client";

import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { type Point, type Area } from 'react-easy-crop';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '../ui/dialog';

export type CroppedImage = {
  url: string;
  blob: Blob;
};

interface ImageCropperProps {
  image: string;
  onCropComplete: (croppedImage: CroppedImage) => void;
  onCancel: () => void;
}

export default function ImageCropper({ image, onCropComplete, onCancel }: ImageCropperProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropChange = useCallback((location: Point) => {
    setCrop(location);
  }, []);

  const onZoomChange = useCallback((value: number[]) => {
    setZoom(value[0]);
  }, []);

  const onCropCompleteInternal = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropImage = async () => {
    if (!croppedAreaPixels) return;

    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels);
      if(croppedImage) {
        onCropComplete(croppedImage);
      }
    } catch (e) {
      console.error(e);
      onCancel();
    }
  };

  return (
    <div className="flex flex-col h-full flex-grow">
        <div className="relative flex-grow">
            <Cropper
                image={image}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={onCropChange}
                onZoomChange={onZoomChange}
                onCropComplete={onCropCompleteInternal}
                cropShape="round"
                showGrid={false}
            />
        </div>
      <div className="p-6 space-y-4 bg-background rounded-b-lg">
        <div className="flex items-center space-x-4">
            <span>Zoom</span>
            <Slider
                value={[zoom]}
                min={1}
                max={3}
                step={0.1}
                onValueChange={onZoomChange}
            />
        </div>
        <DialogFooter>
            <Button variant="outline" onClick={onCancel}>Batal</Button>
            <Button onClick={handleCropImage}>Potong & Simpan</Button>
        </DialogFooter>
      </div>
    </div>
  );
}


function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
}

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area
): Promise<CroppedImage | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  const safeArea = Math.max(image.width, image.height) * 2;

  canvas.width = safeArea;
  canvas.height = safeArea;

  ctx.translate(safeArea / 2, safeArea / 2);
  
  ctx.drawImage(
    image,
    safeArea / 2 - image.width * 0.5,
    safeArea / 2 - image.height * 0.5
  );
  
  const data = ctx.getImageData(0, 0, safeArea, safeArea);

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
    Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((file) => {
      if (file) {
        resolve({ url: URL.createObjectURL(file), blob: file as Blob });
      } else {
        reject(new Error('Canvas is empty'));
      }
    }, 'image/jpeg');
  });
}

    