import { useState } from 'react';
import { Plus, MoreVertical, Eye, Archive, Trash2, Pencil } from 'lucide-react';
import { Button, Badge, Card, CardContent, ConfirmDialog } from '@/components/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useProducts, usePublishProduct, useArchiveProduct, useDeleteProduct } from '@/api/product';
import {
  PRODUCT_STATUS_LABELS,
  PRODUCT_STATUS_COLOURS,
  PRODUCT_TYPE_LABELS,
} from '../../storefront.constants';
import type { Product } from '@fitnassist/database';

interface ProductListProps {
  onEdit: (product: Product) => void;
  onCreate: () => void;
}

export const ProductList = ({ onEdit, onCreate }: ProductListProps) => {
  const { data: products, isLoading } = useProducts();
  const publishProduct = usePublishProduct();
  const archiveProduct = useArchiveProduct();
  const deleteProduct = useDeleteProduct();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">
          No products yet. Create your first product to start selling.
        </p>
        <Button onClick={onCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Product
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">
          {products.length} product{products.length !== 1 ? 's' : ''}
        </p>
        <Button onClick={onCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Product
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <Card key={product.id} className="overflow-hidden">
            {product.imageUrl ? (
              <div className="aspect-video bg-muted">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-video bg-muted flex items-center justify-center">
                <span className="text-muted-foreground text-sm">No image</span>
              </div>
            )}
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium truncate">{product.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={PRODUCT_STATUS_COLOURS[product.status]}>
                      {PRODUCT_STATUS_LABELS[product.status]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {PRODUCT_TYPE_LABELS[product.type]}
                    </span>
                  </div>
                  <p className="text-lg font-semibold mt-2">
                    £{(product.pricePence / 100).toFixed(2)}
                    {product.compareAtPricePence && (
                      <span className="text-sm text-muted-foreground line-through ml-2">
                        £{(product.compareAtPricePence / 100).toFixed(2)}
                      </span>
                    )}
                  </p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(product)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    {product.status === 'DRAFT' && (
                      <DropdownMenuItem
                        onClick={() => publishProduct.mutate({ productId: product.id })}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Publish
                      </DropdownMenuItem>
                    )}
                    {product.status === 'ACTIVE' && (
                      <DropdownMenuItem
                        onClick={() => archiveProduct.mutate({ productId: product.id })}
                      >
                        <Archive className="h-4 w-4 mr-2" />
                        Archive
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => setConfirmDelete(product.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={() => setConfirmDelete(null)}
        title="Delete product"
        description="Are you sure? If this product has orders it will be archived instead."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          if (confirmDelete) deleteProduct.mutate({ productId: confirmDelete });
          setConfirmDelete(null);
        }}
        isLoading={deleteProduct.isPending}
      />
    </>
  );
};
