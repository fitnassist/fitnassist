import type { ReactNode } from 'react';

interface HeroBannerProps {
  title: string;
  imageUrl: string;
  size?: 'default' | 'small';
  children?: ReactNode;
}

export const HeroBanner = ({ title, imageUrl, size = 'default', children }: HeroBannerProps) => {
  return (
    <section
      className={`relative flex items-center justify-center overflow-hidden ${
        size === 'small' ? 'min-h-[30vh]' : 'min-h-[60vh]'
      }`}
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${imageUrl})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#20415c]/85 to-[#5a0c30]/85" />
      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extralight text-white uppercase tracking-widest border-2 border-white px-8 py-4 inline-block">
          {title}
        </h1>
        {children}
      </div>
    </section>
  );
};
