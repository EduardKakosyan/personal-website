import React from 'react';

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <section>
      {/* You can add a blog-specific header or sidebar here */}
      <nav>Blog Navigation</nav>
      {children}
    </section>
  );
} 