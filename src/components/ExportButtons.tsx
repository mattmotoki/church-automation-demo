'use client';

import { useState } from 'react';
import { ParsedData } from '@/types/bulletin';

interface DisplayData {
  Text: string;
  Name: string;
  Description: string;
  Personnel: string;
  Standing: boolean;
  wasMatched: boolean;
}

interface ExportButtonsProps {
  data: DisplayData[];
  filename: string;
}

export default function ExportButtons({ data, filename }: ExportButtonsProps) {
  const [isGeneratingDOCX, setIsGeneratingDOCX] = useState(false);

  const handleDOCXExport = async () => {
    try {
      setIsGeneratingDOCX(true);
      
      // Call Python API
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/generate-bulletin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: data,
          filename: filename.replace('.html', '.docx')
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get the blob from response
      const blob = await response.blob();
      
      // Create download link
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename.replace('.html', '.docx'));
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error generating DOCX:', error);
      alert('Error generating DOCX file. Please try again.');
    } finally {
      setIsGeneratingDOCX(false);
    }
  };

  const handlePDFExport = () => {
    // TODO: Implement PDF export
    alert('PDF export will be available in a future update');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-xl font-semibold mb-4 text-black">Export Bulletin</h2>
      
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Export your parsed bulletin data in various formats:
        </p>
        
        <div className="flex flex-wrap gap-3">
          {/* DOCX Export - Enabled */}
          <button
            onClick={handleDOCXExport}
            disabled={isGeneratingDOCX}
            className={`flex items-center px-4 py-2 text-white rounded-md transition-colors ${
              isGeneratingDOCX 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isGeneratingDOCX ? (
              <>
                <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating DOCX...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Bulletin
              </>
            )}
          </button>

          {/* PDF Export - Disabled */}
          <button
            onClick={handlePDFExport}
            disabled
            className="flex items-center px-4 py-2 bg-gray-300 text-gray-500 rounded-md cursor-not-allowed"
            title="PDF export coming soon"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Export Slides
          </button>
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex">
            <svg className="w-5 h-5 text-blue-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm">
              <p className="text-blue-800 font-medium">Export Information</p>
              <p className="text-blue-700 mt-1">
                DOCX export creates a formatted Word document. PDF export will be added in a future update.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}