import { useState, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Upload, X, Loader2, FileText } from 'lucide-react';
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle, Textarea } from '@/components/ui';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { useCreateProduct, useUpdateProduct } from '@/api/product';
import { createProductSchema, type CreateProductInput } from '@fitnassist/schemas';
import { useProductUpload } from '../../hooks';
import type { Product } from '@fitnassist/database';

interface ProductFormProps {
  product?: Product | null;
  onBack: () => void;
}

export const ProductForm = ({ product, onBack }: ProductFormProps) => {
  const isEditing = !!product;
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const { uploadImage, uploadFile, isUploading } = useProductUpload();

  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? '');
  const [galleryUrls, setGalleryUrls] = useState<string[]>(product?.galleryUrls ?? []);
  const [digitalFileUrl, setDigitalFileUrl] = useState(product?.digitalFileUrl ?? '');
  const [digitalFileName, setDigitalFileName] = useState(product?.digitalFileName ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      type: product?.type ?? 'DIGITAL',
      name: product?.name ?? '',
      shortDescription: product?.shortDescription ?? '',
      pricePence: product?.pricePence ?? 0,
      compareAtPricePence: product?.compareAtPricePence ?? undefined,
      stockCount: product?.stockCount ?? undefined,
      seoTitle: product?.seoTitle ?? '',
      seoDescription: product?.seoDescription ?? '',
    },
  });

  const productType = watch('type');

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const url = await uploadImage(file);
      setImageUrl(url);
    } catch {
      // handled by upload hook
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  }, [uploadImage]);

  const handleGalleryUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploadingGallery(true);
    try {
      const urls = await Promise.all(files.map(uploadImage));
      setGalleryUrls((prev) => [...prev, ...urls]);
    } catch {
      // handled by upload hook
    } finally {
      setUploadingGallery(false);
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  }, [uploadImage]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    try {
      const url = await uploadFile(file);
      setDigitalFileUrl(url);
      setDigitalFileName(file.name);
    } catch {
      // handled by upload hook
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [uploadFile]);

  const onSubmit = (data: CreateProductInput) => {
    const payload = {
      ...data,
      description: description || undefined,
      imageUrl: imageUrl || null,
      galleryUrls,
      digitalFileUrl: digitalFileUrl || null,
      digitalFileName: digitalFileName || null,
    };

    if (isEditing) {
      updateProduct.mutate({ productId: product.id, ...payload }, { onSuccess: onBack });
    } else {
      createProduct.mutate(payload, { onSuccess: onBack });
    }
  };

  const isSaving = createProduct.isPending || updateProduct.isPending;

  return (
    <div>
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to products
      </Button>

      <h2 className="text-xl font-semibold mb-6">{isEditing ? 'Edit Product' : 'Create Product'}</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
        {/* Type */}
        <div className="space-y-2">
          <Label>Product Type</Label>
          <div className="flex gap-3">
            {(['DIGITAL', 'PHYSICAL'] as const).map((t) => (
              <label key={t} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value={t} {...register('type')} className="accent-primary" disabled={isEditing} />
                <span className="text-sm">{t === 'DIGITAL' ? 'Digital' : 'Physical'}</span>
              </label>
            ))}
          </div>
          {isEditing && <p className="text-xs text-muted-foreground">Product type cannot be changed after creation</p>}
        </div>

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...register('name')} placeholder="e.g. 12-Week Shred Program" />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>

        {/* Short description */}
        <div className="space-y-2">
          <Label htmlFor="shortDescription">Short Description</Label>
          <Textarea id="shortDescription" {...register('shortDescription')} placeholder="Brief summary shown in product cards" rows={2} />
          {errors.shortDescription && <p className="text-sm text-destructive">{errors.shortDescription.message}</p>}
        </div>

        {/* Rich description */}
        <div className="space-y-2">
          <Label>Full Description</Label>
          <RichTextEditor
            content={description}
            onChange={setDescription}
            placeholder="Detailed product description..."
            onUploadImage={uploadImage}
          />
        </div>

        {/* Pricing */}
        <Card>
          <CardHeader><CardTitle className="text-base">Pricing</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pricePence">Price (pence)</Label>
              <Input id="pricePence" type="number" {...register('pricePence', { valueAsNumber: true })} placeholder="e.g. 1999 for £19.99" />
              {errors.pricePence && <p className="text-sm text-destructive">{errors.pricePence.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="compareAtPricePence">Compare-at Price (pence, optional)</Label>
              <Input id="compareAtPricePence" type="number" {...register('compareAtPricePence', { valueAsNumber: true })} placeholder="Original price for strikethrough" />
            </div>
          </CardContent>
        </Card>

        {/* Main image */}
        <Card>
          <CardHeader><CardTitle className="text-base">Images</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-2 block">Main Image</Label>
              {imageUrl ? (
                <div className="relative inline-block">
                  <img src={imageUrl} alt="Product" className="h-40 rounded-lg object-cover" />
                  <button type="button" onClick={() => setImageUrl('')} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <Button type="button" variant="outline" onClick={() => imageInputRef.current?.click()} disabled={uploadingImage}>
                  {uploadingImage ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                  Upload Image
                </Button>
              )}
              <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </div>

            {/* Gallery */}
            <div>
              <Label className="mb-2 block">Gallery</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {galleryUrls.map((url, i) => (
                  <div key={i} className="relative">
                    <img src={url} alt={`Gallery ${i + 1}`} className="h-24 w-24 rounded object-cover" />
                    <button type="button" onClick={() => setGalleryUrls((prev) => prev.filter((_, j) => j !== i))} className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => galleryInputRef.current?.click()} disabled={uploadingGallery}>
                {uploadingGallery ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                Add Images
              </Button>
              <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryUpload} />
            </div>
          </CardContent>
        </Card>

        {/* Digital file upload */}
        {productType === 'DIGITAL' && (
          <Card>
            <CardHeader><CardTitle className="text-base">Digital File</CardTitle></CardHeader>
            <CardContent>
              {digitalFileUrl ? (
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm flex-1 truncate">{digitalFileName}</span>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setDigitalFileUrl(''); setDigitalFileName(''); }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploadingFile}>
                  {uploadingFile ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                  Upload File
                </Button>
              )}
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
              <p className="text-xs text-muted-foreground mt-2">PDF, ZIP, or any file up to 100MB. Buyers can download after purchase.</p>
            </CardContent>
          </Card>
        )}

        {/* Stock (physical only) */}
        {productType === 'PHYSICAL' && (
          <div className="space-y-2">
            <Label htmlFor="stockCount">Stock Count</Label>
            <Input id="stockCount" type="number" {...register('stockCount', { valueAsNumber: true })} placeholder="Leave empty for unlimited" />
            <p className="text-xs text-muted-foreground">Leave empty if you don't track stock</p>
          </div>
        )}

        {/* SEO */}
        <Card>
          <CardHeader><CardTitle className="text-base">SEO</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="seoTitle">SEO Title</Label>
              <Input id="seoTitle" {...register('seoTitle')} placeholder="Page title for search engines" maxLength={60} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seoDescription">SEO Description</Label>
              <Textarea id="seoDescription" {...register('seoDescription')} placeholder="Meta description for search engines" rows={2} maxLength={160} />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-3">
          <Button type="submit" disabled={isSaving || isUploading}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? 'Save Changes' : 'Create Product'}
          </Button>
          <Button type="button" variant="outline" onClick={onBack}>Cancel</Button>
        </div>
      </form>
    </div>
  );
};
