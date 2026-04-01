import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Dialog, DialogContent } from '@/components/ui';
import { Images } from 'lucide-react';

interface GalleryImage {
  id: string;
  url: string;
  sortOrder: number;
}

interface ProfileGalleryProps {
  images: GalleryImage[];
}

export const ProfileGallery = ({ images }: ProfileGalleryProps) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (images.length === 0) return null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl font-light uppercase tracking-wider">
            <Images className="h-5 w-5" />
            Gallery
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {images.map((image) => (
              <button
                key={image.id}
                type="button"
                onClick={() => setSelectedImage(image.url)}
                className="aspect-square rounded-lg overflow-hidden hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <img src={image.url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-black border-none">
          {selectedImage && (
            <img src={selectedImage} alt="" className="w-full h-auto max-h-[80vh] object-contain" />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
