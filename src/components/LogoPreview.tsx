import React from 'react';
import { Logo } from './Logo';
import { ArrowLeft, Download } from 'lucide-react';
import { Link } from 'react-router-dom';

export function LogoPreview() {
  const handleDownload = () => {
    // Create SVG content using the same Bot icon from Lucide
    const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 24 24" fill="none" stroke="#FF6B6B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 8V4H8" />
        <rect width="16" height="12" x="4" y="8" rx="2" />
        <path d="M2 14h2" />
        <path d="M20 14h2" />
        <path d="M15 13v2" />
        <path d="M9 13v2" />
      </svg>
    `;

    // Create blob from SVG content
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    // Create temporary link and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ai-friends-hub-logo.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-fun-red via-fun-mint to-fun-yellow p-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <Link 
          to="/"
          className="inline-flex items-center space-x-2 text-white hover:text-white/90 transition-colors mb-8"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Home</span>
        </Link>

        {/* Logo Display */}
        <div className="flex flex-col items-center justify-center">
          <div className="bg-white p-16 rounded-3xl shadow-fun flex items-center justify-center" style={{ width: '512px', height: '512px' }}>
            <Logo size="lg" showText={false} variant="dark" />
          </div>

          {/* Download Button */}
          <div className="mt-8 p-6 bg-white/10 backdrop-blur-sm rounded-xl text-white max-w-md text-center">
            <h3 className="text-xl font-bold mb-4">Download Logo</h3>
            <button
              onClick={handleDownload}
              className="btn-fun px-6 py-3 rounded-full text-white font-medium inline-flex items-center space-x-2"
            >
              <Download className="h-5 w-5" />
              <span>Download SVG</span>
            </button>
            <p className="mt-4 text-white/80 text-sm">
              The logo will be downloaded as a high-quality SVG file.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}