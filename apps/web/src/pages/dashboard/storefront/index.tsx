import { useState } from 'react';
import { Package, Tag, ShoppingCart } from 'lucide-react';
import { ResponsiveTabs, TabsContent } from '@/components/ui';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { useTierAccess } from '@/hooks/useFeatureAccess';
import { ProductList, ProductForm, CouponList, CouponForm, OrderList } from './components';
import type { Product } from '@fitnassist/database';

const TAB_OPTIONS = [
  { value: 'products', label: 'Products', icon: <Package className="h-4 w-4" /> },
  { value: 'coupons', label: 'Coupons', icon: <Tag className="h-4 w-4" /> },
  { value: 'orders', label: 'Orders', icon: <ShoppingCart className="h-4 w-4" /> },
];

type View =
  | { type: 'list' }
  | { type: 'product-form'; product?: Product }
  | { type: 'coupon-form' };

export const StorefrontPage = () => {
  const { hasAccess, isLoading: tierLoading } = useTierAccess('ELITE');
  const [activeTab, setActiveTab] = useState('products');
  const [view, setView] = useState<View>({ type: 'list' });

  if (tierLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="h-96 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <h1 className="text-2xl font-bold mb-6">Storefront</h1>
        <UpgradePrompt requiredTier="ELITE" featureName="Product Storefront" />
      </div>
    );
  }

  // Show forms as full-page views
  if (view.type === 'product-form') {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <ProductForm product={view.product} onBack={() => setView({ type: 'list' })} />
      </div>
    );
  }

  if (view.type === 'coupon-form') {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <CouponForm onBack={() => setView({ type: 'list' })} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold mb-6">Storefront</h1>

      <ResponsiveTabs options={TAB_OPTIONS} value={activeTab} onValueChange={setActiveTab}>
        <TabsContent value="products">
          <ProductList
            onEdit={(product) => setView({ type: 'product-form', product })}
            onCreate={() => setView({ type: 'product-form' })}
          />
        </TabsContent>

        <TabsContent value="coupons">
          <CouponList onCreate={() => setView({ type: 'coupon-form' })} />
        </TabsContent>

        <TabsContent value="orders">
          <OrderList />
        </TabsContent>
      </ResponsiveTabs>
    </div>
  );
};

export default StorefrontPage;
