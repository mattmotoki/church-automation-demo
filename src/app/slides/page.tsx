'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ShellBlowingTab from '@/components/slides/ShellBlowingTab';
import WelcomeTab from '@/components/slides/WelcomeTab';
import CallToWorshipTab from '@/components/slides/CallToWorshipTab';
import MessageForAllGenerationsTab from '@/components/slides/MessageForAllGenerationsTab';
import PrayerOfDedicationTab from '@/components/slides/PrayerOfDedicationTab';
import GloriaPatriTab from '@/components/slides/GloriaPatriTab';
import DoxologyTab from '@/components/slides/DoxologyTab';
import BenedictionTab from '@/components/slides/BenedictionTab';
import PostludeTab from '@/components/slides/PostludeTab';


interface Hymn {
  number: string;
  title: string;
  has_text: boolean;
  text_url: string;
  lyrics: string;
  parsed_lyrics: string;
  author?: string;
  composer?: string;
  tune_name?: string;
  text_copyright?: string;
  tune_copyright?: string;
}

// Helper function to get Tongan book names
function getTonganBookName(bookCode: string): string | null {
  const tonganNames: Record<string, string> = {
    'GEN': 'Kenesi', 'EXO': 'ʻEkisotosi', 'LEV': 'Levitiko', 'NUM': 'Nemipia', 'DEU': 'Teutelonomi',
    'JOS': 'Siosiua', 'JDG': 'Fakamaau', 'RUT': 'Lute', '1SA': '1 Samueli', '2SA': '2 Samueli',
    '1KI': '1 Tuʻi', '2KI': '2 Tuʻi', '1CH': '1 Kalonikali', '2CH': '2 Kalonikali',
    'EZR': 'ʻEsila', 'NEH': 'Nehimaia', 'EST': 'ʻEseta', 'JOB': 'Siope', 'PSA': 'Saame',
    'PRO': 'Lea Fakatatauki', 'ECC': 'ʻEkilisiasitesi', 'SNG': 'Hiva ʻa Solomone', 'ISA': 'ʻAisea',
    'JER': 'Selemaia', 'LAM': 'Tangilāulau', 'EZK': 'ʻIsikieli', 'DAN': 'Taniela',
    'HOS': 'Hosea', 'JOL': 'Soeli', 'AMO': 'ʻAmosi', 'OBA': 'ʻOpataia', 'JON': 'Siona',
    'MIC': 'Maika', 'NAM': 'Nahumi', 'HAB': 'Hapakuki', 'ZEP': 'Sefanaia', 'HAG': 'Hakai',
    'ZEC': 'Sekalaia', 'MAL': 'Malaki',
    'MAT': 'Matiu', 'MRK': 'Maʻake', 'LUK': 'Luke', 'JHN': 'Sione', 'ACT': 'Ngaue',
    'ROM': 'Loma', '1CO': '1 Kolinito', '2CO': '2 Kolinito', 'GAL': 'Kalātia',
    'EPH': 'ʻEfeso', 'PHP': 'Filipai', 'COL': 'Kolosi', '1TH': '1 Tesalonaika',
    '2TH': '2 Tesalonaika', '1TI': '1 Timote', '2TI': '2 Timote', 'TIT': 'Taitosi',
    'PHM': 'Filimona', 'HEB': 'Hepelū', 'JAS': 'Semisi', '1PE': '1 Pita', '2PE': '2 Pita',
    '1JN': '1 Sione', '2JN': '2 Sione', '3JN': '3 Sione', 'JUD': 'Siuta', 'REV': 'Fakahā'
  };
  return tonganNames[bookCode] || null;
}

export default function SlidesPage() {
  const [activeTab, setActiveTab] = useState<'shell-blowing' | 'welcome' | 'call-to-worship' | 'message' | 'prayer' | 'gloria' | 'hymn' | 'scripture' | 'doxology' | 'benediction' | 'postlude'>('shell-blowing');
  
  // Background state for hymns and scripture tabs
  const [backgroundImage, setBackgroundImage] = useState<File | null>(null);
  const [selectedBackground, setSelectedBackground] = useState<any>(null);
  const [showBackgroundSelector, setShowBackgroundSelector] = useState(false);
  const [availableBackgrounds, setAvailableBackgrounds] = useState<any[]>([]);
  
  // Scripture state
  const [scriptureVersion, setScriptureVersion] = useState<'nrsvue' | 'tmb' | 'combined'>('nrsvue');
  const [scriptureBook, setScriptureBook] = useState<string>('PSA');
  const [availableBooks, setAvailableBooks] = useState<{ code: string; name: string }[]>([]);
  const [scriptureChapter, setScriptureChapter] = useState<number>(23);
  const [scriptureStartVerse, setScriptureStartVerse] = useState<number>(1);
  const [scriptureEndVerse, setScriptureEndVerse] = useState<number>(6);
  const [isGeneratingScripture, setIsGeneratingScripture] = useState(false);
  const [scriptureError, setScriptureError] = useState<string | null>(null);
  const [scriptureSuccess, setScriptureSuccess] = useState<string | null>(null);
  const [availableChapters, setAvailableChapters] = useState<number[]>([]);
  const [availableVerses, setAvailableVerses] = useState<number[]>([]);
  const [selectedHymnal, setSelectedHymnal] = useState<'UMH' | 'FWS' | 'THB'>('UMH');
  const [selectedHymn, setSelectedHymn] = useState<Hymn | null>(null);
  const [hymns, setHymns] = useState<Hymn[]>([]);
  const [hymnError, setHymnError] = useState<string | null>(null);
  const [hymnSuccess, setHymnSuccess] = useState<string | null>(null);
  const [isGeneratingHymn, setIsGeneratingHymn] = useState(false);

  // Helper function to convert image path to base64
  const fetchImageAsBase64 = async (imagePath: string): Promise<string> => {
    const response = await fetch(imagePath);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  };

  // Function to open background selector
  const openBackgroundSelector = () => {
    setShowBackgroundSelector(true);
  };

  // Create object URL for uploaded image
  const uploadedImageUrl = useMemo(() => {
    if (backgroundImage) {
      return URL.createObjectURL(backgroundImage);
    }
    return null;
  }, [backgroundImage]);

  // Clean up object URL
  useEffect(() => {
    return () => {
      if (uploadedImageUrl) {
        URL.revokeObjectURL(uploadedImageUrl);
      }
    };
  }, [uploadedImageUrl]);

  // Load available backgrounds
  useEffect(() => {
    const loadBackgrounds = async () => {
      try {
        const response = await fetch('/data/backgrounds.json');
        if (response.ok) {
          const data = await response.json();
          setAvailableBackgrounds(data);
        }
      } catch (err) {
        console.error('Error loading backgrounds:', err);
      }
    };
    loadBackgrounds();
  }, []);

  // Load hymns data from individual files
  useEffect(() => {
    const loadHymns = async () => {
      try {
        const folderName = selectedHymnal === 'UMH' ? 'umh' : selectedHymnal === 'FWS' ? 'fws' : 'thb';
        
        // Get list of all hymn files from API
        const indexResponse = await fetch(`/api/list-hymns?hymnal=${folderName}`);
        if (!indexResponse.ok) {
          throw new Error('Failed to load hymn index');
        }
        const hymnList: string[] = await indexResponse.json();
        
        // Load each hymn's data
        const hymnPromises = hymnList.map(async (filename: string) => {
          const number = filename.replace('.json', '');
          try {
            const response = await fetch(`/data/hymns/${folderName}/${filename}`);
            if (response.ok) {
              const data = await response.json();
              return {
                number: data.hymn_number || number,
                title: data.title,
                has_text: !!data.lyrics,
                text_url: '',
                lyrics: data.lyrics,  // Keep original format
                parsed_lyrics: data.lyrics,  // Keep original format
                author: data.author || '',
                composer: data.composer || '',
                tune_name: data.tune_name || '',
                text_copyright: data.text_copyright || '',
                tune_copyright: data.tune_copyright || ''
              };
            }
            return null;
          } catch {
            return null;
          }
        });
        
        const hymnDataArray = await Promise.all(hymnPromises);
        const validHymns = hymnDataArray.filter(h => h !== null);
        setHymns(validHymns);
      } catch (err) {
        console.error('Error loading hymns:', err);
        setHymnError('Failed to load hymn data');
      }
    };
    
    loadHymns();
  }, [selectedHymnal]);


  // No need to update background when tab changes - always use ocean-sunrise on slides page
  // The useEffect above handles the initial selection

  // Load available scripture books for selected version
  useEffect(() => {
    const loadBooks = async () => {
      try {
        if (scriptureVersion === 'combined') {
          // For combined mode, fetch NRSVUE books and add Tongan names
          const res = await fetch(`/api/list-books?version=nrsvue`);
          if (!res.ok) return;
          const nrsvueBooks = await res.json();
          
          // Add Tongan names in parentheses for combined mode
          const combinedBooks = nrsvueBooks.map((book: any) => {
            const tonganName = getTonganBookName(book.code);
            return {
              code: book.code,
              name: tonganName ? `${book.name} (${tonganName})` : book.name
            };
          });
          
          setAvailableBooks(combinedBooks);
          if (combinedBooks?.length && !combinedBooks.find((b: any) => b.code === scriptureBook)) {
            setScriptureBook(combinedBooks[0].code);
          }
        } else {
          // Single version mode
          const res = await fetch(`/api/list-books?version=${scriptureVersion}`);
          if (!res.ok) return;
          const data = await res.json();
          setAvailableBooks(data);
          if (data?.length && !data.find((b: any) => b.code === scriptureBook)) {
            setScriptureBook(data[0].code);
          }
        }
      } catch {}
    };
    loadBooks();
  }, [scriptureVersion, scriptureBook]);

  // Load chapters when book or version changes
  useEffect(() => {
    const loadChapters = async () => {
      try {
        if (!scriptureBook) return;
        // For combined mode, use nrsvue as the base
        const versionToUse = scriptureVersion === 'combined' ? 'nrsvue' : scriptureVersion;
        const res = await fetch(`/api/list-chapters?version=${versionToUse}&book=${scriptureBook}`);
        if (!res.ok) return;
        const chapters: number[] = await res.json();
        setAvailableChapters(chapters);
        if (chapters.length) {
          if (!chapters.includes(scriptureChapter)) {
            setScriptureChapter(chapters[0]);
          }
        }
      } catch {}
    };
    loadChapters();
  }, [scriptureVersion, scriptureBook, scriptureChapter]);

  // Load verses when chapter/book/version changes
  useEffect(() => {
    const loadVerses = async () => {
      try {
        if (!scriptureBook || !scriptureChapter) return;
        // For combined mode, use nrsvue as the base
        const versionToUse = scriptureVersion === 'combined' ? 'nrsvue' : scriptureVersion;
        const res = await fetch(`/api/list-verses?version=${versionToUse}&book=${scriptureBook}&chapter=${scriptureChapter}`);
        if (!res.ok) return;
        const verses: number[] = await res.json();
        setAvailableVerses(verses);
        if (verses.length) {
          if (!verses.includes(scriptureStartVerse)) setScriptureStartVerse(verses[0]);
          if (!verses.includes(scriptureEndVerse)) setScriptureEndVerse(verses[verses.length - 1]);
        }
      } catch {}
    };
    loadVerses();
  }, [scriptureVersion, scriptureBook, scriptureChapter, scriptureStartVerse, scriptureEndVerse]);



  const generateHymnSlides = async () => {
    if (!selectedHymn) {
      setHymnError('Please select a hymn first.');
      return;
    }

    if (!selectedHymn.has_text || (!selectedHymn.parsed_lyrics && !selectedHymn.lyrics)) {
      setHymnError('This hymn does not have lyrics available for slide generation.');
      return;
    }

    setIsGeneratingHymn(true);
    setHymnError(null);
    setHymnSuccess(null);

    try {
      let requestBody: any = {
        hymn: {
          number: selectedHymn.number,
          title: selectedHymn.title,
          hymnal: selectedHymnal,
          lyrics: selectedHymn.parsed_lyrics || selectedHymn.lyrics,
          author: selectedHymn.author || '',
          composer: selectedHymn.composer || '',
          tune_name: selectedHymn.tune_name || '',
          text_copyright: selectedHymn.text_copyright || '',
          tune_copyright: selectedHymn.tune_copyright || ''
        }
      };

      // Add background image if provided
      if (backgroundImage) {
        const base64Image = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(backgroundImage);
        });
        requestBody.background_image = base64Image;
      } else if (selectedBackground) {
        // Convert selected background to base64
        const base64Image = await fetchImageAsBase64(selectedBackground.path);
        requestBody.background_image = base64Image;
      } else {
        // Use default ocean-sunrise background
        const base64Image = await fetchImageAsBase64('/images/ocean-sunrise-golden-worship-background.jpg');
        requestBody.background_image = base64Image;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/generate-hymn-slides`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedHymnal}_${selectedHymn.number}_${selectedHymn.title.replace(/[^a-zA-Z0-9]/g, '_')}_slides.pptx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        setHymnSuccess(`Successfully generated hymn slides for "${selectedHymn.title}"!`);
      } else {
        const errorData = await response.json();
        setHymnError(errorData.error || 'Failed to generate hymn slides');
      }
    } catch (err) {
      setHymnError('An error occurred while generating hymn slides');
      console.error('Generate hymn slides error:', err);
    } finally {
      setIsGeneratingHymn(false);
    }
  };

  const formatHymnLyrics = (lyrics: any) => {
    if (!lyrics) return [];
    
    // Check if lyrics is already an array (new format)
    if (Array.isArray(lyrics)) {
      // Handle array of objects with page_name and text
      return lyrics.map((item, index) => ({
        verse: index + 1,
        text: item.text || item,
        page_name: item.page_name || `Verse ${index + 1}`
      }));
    }
    
    // Check if lyrics is a JSON string
    if (typeof lyrics === 'string') {
      try {
        const parsed = JSON.parse(lyrics);
        if (Array.isArray(parsed)) {
          // Handle array of objects with page_name and text
          return parsed.map((item, index) => ({
            verse: index + 1,
            text: item.text || item,
            page_name: item.page_name || `Verse ${index + 1}`
          }));
        }
      } catch {
        // Not JSON, handle as plain text
      }
      
      // Fallback: Split by <br> tags (page breaks) or double newlines (verses)
      const verses = lyrics.split(/<br>|\n\s*\n/).filter(v => v.trim());
      return verses.map((verse, index) => ({
        verse: index + 1,
        text: verse.trim(),
        page_name: `Verse ${index + 1}`
      }));
    }
    
    return [];
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Generate Slides
              </h1>
            </div>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </Link>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('shell-blowing')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'shell-blowing' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Shell Blowing
              </button>
              <button
                onClick={() => setActiveTab('welcome')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'welcome' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Welcome
              </button>
              <button
                onClick={() => setActiveTab('call-to-worship')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'call-to-worship' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Call to Worship
              </button>
              <button
                onClick={() => setActiveTab('message')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'message' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Message for All Generations
              </button>
              <button
                onClick={() => setActiveTab('prayer')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'prayer' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Prayer of Dedication
              </button>
              <button
                onClick={() => setActiveTab('gloria')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'gloria' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Gloria Patri
              </button>
              <button
                onClick={() => setActiveTab('hymn')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'hymn' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Hymns
              </button>
              <button
                onClick={() => setActiveTab('scripture')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'scripture' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Scriptures
              </button>
              <button
                onClick={() => setActiveTab('doxology')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'doxology' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Doxology
              </button>
              <button
                onClick={() => setActiveTab('benediction')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'benediction' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Benediction
              </button>
              <button
                onClick={() => setActiveTab('postlude')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'postlude' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Postlude
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'shell-blowing' && <ShellBlowingTab />}

        {activeTab === 'welcome' && <WelcomeTab />}

        {activeTab === 'call-to-worship' && <CallToWorshipTab />}

        {activeTab === 'message' && <MessageForAllGenerationsTab />}

        {activeTab === 'prayer' && <PrayerOfDedicationTab />}

        {activeTab === 'gloria' && <GloriaPatriTab />}

        {activeTab === 'hymn' && (
        <>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">Hymns</h2>
          <div className="space-y-4">
            
            {/* Hymnal Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hymnal
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="UMH"
                    checked={selectedHymnal === 'UMH'}
                    onChange={(e) => {
                      setSelectedHymnal(e.target.value as 'UMH' | 'FWS' | 'THB');
                      setSelectedHymn(null);
                    }}
                    className="mr-2"
                  />
                  The United Methodist Hymnal (UMH)
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="FWS"
                    checked={selectedHymnal === 'FWS'}
                    onChange={(e) => {
                      setSelectedHymnal(e.target.value as 'UMH' | 'FWS' | 'THB');
                      setSelectedHymn(null);
                    }}
                    className="mr-2"
                  />
                  The Faith We Sing (FWS)
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="THB"
                    checked={selectedHymnal === 'THB'}
                    onChange={(e) => {
                      setSelectedHymnal(e.target.value as 'UMH' | 'FWS' | 'THB');
                      setSelectedHymn(null);
                    }}
                    className="mr-2"
                  />
                  Tongan Hymn Book (THB)
                </label>
              </div>
            </div>

            {/* Hymn Selection */}
            <div>
              <label htmlFor="hymn-select" className="block text-sm font-medium text-gray-700 mb-2">
                Select Hymn
              </label>
              <select
                id="hymn-select"
                value={hymns.findIndex(h => h === selectedHymn)}
                onChange={(e) => {
                  const index = parseInt(e.target.value);
                  if (index >= 0 && index < hymns.length) {
                    setSelectedHymn(hymns[index]);
                  } else {
                    setSelectedHymn(null);
                  }
                }}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="-1">-- Select a hymn --</option>
                {hymns.map((hymn, index) => (
                  <option key={`${selectedHymnal}-${index}`} value={index}>
                    {hymn.number} - {hymn.title} {hymn.has_text ? '✓' : '(no lyrics)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Hymn Info */}
            {selectedHymn && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h3 className="font-semibold text-blue-900">
                  {selectedHymnal} {selectedHymn.number}: {selectedHymn.title}
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  {selectedHymn.has_text ? (
                    <span className="text-green-600">✓ Lyrics available for slide generation</span>
                  ) : (
                    <span className="text-red-600">✗ No lyrics available for this hymn</span>
                  )}
                </p>
                
                {/* Author and Composer Info */}
                {(selectedHymn.author || selectedHymn.composer || selectedHymn.tune_name) && (
                  <div className="mt-2 text-sm text-blue-700">
                    {selectedHymn.author && (
                      <p><span className="font-medium">Author:</span> {selectedHymn.author}</p>
                    )}
                    {selectedHymn.composer && (
                      <p><span className="font-medium">Composer:</span> {selectedHymn.composer}</p>
                    )}
                    {selectedHymn.tune_name && (
                      <p><span className="font-medium">Tune:</span> {selectedHymn.tune_name}</p>
                    )}
                  </div>
                )}
                
                {/* Copyright Information */}
                {(selectedHymn.text_copyright || selectedHymn.tune_copyright) && (
                  <div className="mt-3 pt-2 border-t border-blue-200">
                    <h4 className="text-sm font-semibold text-blue-900 mb-1">Copyright Information:</h4>
                    <div className="text-sm text-blue-700">
                      {selectedHymn.text_copyright && (
                        <p><span className="font-medium">Text:</span> {selectedHymn.text_copyright}</p>
                      )}
                      {selectedHymn.tune_copyright && (
                        <p><span className="font-medium">Tune:</span> {selectedHymn.tune_copyright}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Generate PowerPoint Button - Moved here and made full width */}
            <div className="mt-6">
              <button
                onClick={generateHymnSlides}
                disabled={isGeneratingHymn || !selectedHymn || !selectedHymn.has_text}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-base font-medium"
              >
                {isGeneratingHymn ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Generate Hymn Slides
                  </>
                )}
              </button>
            </div>

            {/* Background Image Section */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Background Image (Optional)</h3>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button
                    onClick={openBackgroundSelector}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Choose from Gallery
                  </button>
                  <button
                    onClick={() => document.getElementById('hymn-background-image-input')?.click()}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload New
                  </button>
                </div>

                <input
                  id="hymn-background-image-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setBackgroundImage(file);
                      setSelectedBackground(null);
                      // Show success message briefly
                      setHymnSuccess(`Image "${file.name}" uploaded successfully!`);
                      setTimeout(() => setHymnSuccess(null), 3000);
                    }
                  }}
                  className="hidden"
                />
                
                {(backgroundImage || selectedBackground) ? (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900">Selected Background:</p>
                        <p className="text-sm text-blue-700">
                          {backgroundImage ? backgroundImage.name : selectedBackground?.display_name}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setBackgroundImage(null);
                          setSelectedBackground(null);
                        }}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                    {/* Show preview for both uploaded image and selected background - 16:9 aspect ratio, 70% width */}
                    <div className="mt-3 relative w-[70%] mx-auto rounded-lg overflow-hidden border border-blue-300" style={{ paddingBottom: '39.375%' }}>
                      {uploadedImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                          src={uploadedImageUrl} 
                          alt={backgroundImage?.name}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : selectedBackground ? (
                        <Image 
                          src={selectedBackground.path} 
                          alt={selectedBackground.display_name}
                          fill
                          className="object-cover"
                          sizes="100vw"
                        />
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Default Background</p>
                          <p className="text-sm text-gray-500">Ocean Sunrise Golden will be used</p>
                        </div>
                      </div>
                    </div>
                    {/* Show default background preview - 16:9 aspect ratio, 70% width */}
                    <div className="mt-3 relative w-[70%] mx-auto rounded-lg overflow-hidden border border-gray-300" style={{ paddingBottom: '39.375%' }}>
                      <Image 
                        src="/images/ocean-sunrise-golden-worship-background.jpg" 
                        alt="Ocean Sunrise Golden (Default)"
                        fill
                        className="object-cover"
                        sizes="70vw"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {hymnError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800 text-sm">{hymnError}</p>
              </div>
            )}

            {hymnSuccess && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-800 text-sm">{hymnSuccess}</p>
              </div>
            )}
          </div>
        </div>
        </>
        )}

        {activeTab === 'scripture' && (
        <>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">Scriptures</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Version</label>
              <select
                value={scriptureVersion}
                onChange={(e) => setScriptureVersion(e.target.value as 'nrsvue' | 'tmb' | 'combined')}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="nrsvue">NRSVUE</option>
                <option value="tmb">TMB</option>
                <option value="combined">Combined (NRSVUE + TMB)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Book</label>
              <select
                value={scriptureBook}
                onChange={(e) => setScriptureBook(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {availableBooks.map((b) => (
                  <option key={b.code} value={b.code}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Chapter</label>
              <select
                value={scriptureChapter}
                onChange={(e) => setScriptureChapter(parseInt(e.target.value, 10))}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {availableChapters.map((ch) => (
                  <option key={ch} value={ch}>{ch}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Verse</label>
                <select
                  value={scriptureStartVerse}
                  onChange={(e) => setScriptureStartVerse(parseInt(e.target.value, 10))}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {availableVerses.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Verse</label>
                <select
                  value={scriptureEndVerse}
                  onChange={(e) => setScriptureEndVerse(parseInt(e.target.value, 10))}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {availableVerses.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Generate PowerPoint Button - Moved here and made full width */}
          <div className="mt-6">
            <button
              onClick={async () => {
                setIsGeneratingScripture(true);
                setScriptureError(null);
                setScriptureSuccess(null);
                try {
                  let verses: any[] = [];
                  let verses_alt: any[] | undefined = undefined;

                  if (scriptureVersion === 'combined') {
                    // Fetch both NRSVUE and TMB for combined mode
                    const nrsvuePath = `/data/bibles/nrsvue/${scriptureBook}_chapter_${scriptureChapter}.json`;
                    const tmbPath = `/data/bibles/tmb/${scriptureBook}_chapter_${scriptureChapter}.json`;
                    
                    const [nrsvueRes, tmbRes] = await Promise.all([
                      fetch(nrsvuePath),
                      fetch(tmbPath)
                    ]);
                    
                    if (!nrsvueRes.ok || !tmbRes.ok) throw new Error('Chapter not found');
                    
                    const [nrsvueChapter, tmbChapter] = await Promise.all([
                      nrsvueRes.json(),
                      tmbRes.json()
                    ]);
                    
                    verses = (nrsvueChapter.verses || [])
                      .filter((v: any) => typeof v.verse === 'number' && v.verse >= scriptureStartVerse && v.verse <= scriptureEndVerse)
                      .map((v: any) => ({ verse: v.verse, text: v.text }));
                    
                    verses_alt = (tmbChapter.verses || [])
                      .filter((v: any) => typeof v.verse === 'number' && v.verse >= scriptureStartVerse && v.verse <= scriptureEndVerse)
                      .map((v: any) => ({ verse: v.verse, text: v.text }));
                    
                    if (!verses.length && !verses_alt?.length) throw new Error('No verses in range');
                  } else {
                    // Single translation mode
                    const chapterPath = `/data/bibles/${scriptureVersion}/${scriptureBook}_chapter_${scriptureChapter}.json`;
                    const res = await fetch(chapterPath);
                    if (!res.ok) throw new Error('Chapter not found');
                    const chapter = await res.json();
                    verses = (chapter.verses || [])
                      .filter((v: any) => typeof v.verse === 'number' && v.verse >= scriptureStartVerse && v.verse <= scriptureEndVerse)
                      .map((v: any) => ({ verse: v.verse, text: v.text }));
                    if (!verses.length) throw new Error('No verses in range');
                  }

                  const body: any = { reference: { book: scriptureBook, chapter: scriptureChapter }, verses };
                  if (verses_alt) {
                    body.verses_alt = verses_alt;
                  }
                  if (backgroundImage) {
                    const base64Image = await new Promise<string>((resolve) => {
                      const reader = new FileReader();
                      reader.onload = () => resolve(reader.result as string);
                      reader.readAsDataURL(backgroundImage);
                    });
                    body.background_image = base64Image;
                  } else if (selectedBackground) {
                    // Convert selected background to base64
                    const base64Image = await fetchImageAsBase64(selectedBackground.path);
                    body.background_image = base64Image;
                  } else {
                    // Use default ocean-sunrise background
                    const base64Image = await fetchImageAsBase64('/images/ocean-sunrise-golden-worship-background.jpg');
                    body.background_image = base64Image;
                  }

                  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                  const resp = await fetch(`${apiUrl}/api/generate-scripture-slides`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                  });
                  if (!resp.ok) {
                    try {
                      const err = await resp.json();
                      throw new Error(err.error || 'Failed to generate scripture slides');
                    } catch {
                      throw new Error('Failed to generate scripture slides');
                    }
                  }
                  const blob = await resp.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${scriptureBook}_${scriptureChapter}_${scriptureStartVerse}-${scriptureEndVerse}_slides.pptx`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  window.URL.revokeObjectURL(url);
                  setScriptureSuccess('Successfully generated scripture slides!');
                } catch (e: any) {
                  setScriptureError(e?.message || 'Failed to generate scripture slides');
                } finally {
                  setIsGeneratingScripture(false);
                }
              }}
              disabled={isGeneratingScripture}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-base font-medium"
            >
              {isGeneratingScripture ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Generate Scripture Slides
                </>
              )}
            </button>
          </div>

          {/* Background Image Section */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Background Image (Optional)</h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={openBackgroundSelector}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  Choose from Gallery
                </button>
                <button
                  onClick={() => document.getElementById('scripture-background-image-input')?.click()}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                >
                  Upload New
                </button>
              </div>

              <input
                id="scripture-background-image-input"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setBackgroundImage(file);
                    setSelectedBackground(null);
                    // Show success message briefly
                    setScriptureSuccess(`Image "${file.name}" uploaded successfully!`);
                    setTimeout(() => setScriptureSuccess(null), 3000);
                  }
                }}
                className="hidden"
              />
              
              {/* Selected Background Display */}
              {(backgroundImage || selectedBackground) ? (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900">Selected Background:</p>
                      <p className="text-sm text-blue-700">
                        {backgroundImage ? backgroundImage.name : selectedBackground?.display_name}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setBackgroundImage(null);
                        setSelectedBackground(null);
                      }}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                  {/* Show preview for both uploaded image and selected background - 16:9 aspect ratio, 70% width */}
                  <div className="mt-3 relative w-[70%] mx-auto rounded-lg overflow-hidden border border-blue-300" style={{ paddingBottom: '39.375%' }}>
                    {uploadedImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={uploadedImageUrl} 
                        alt={backgroundImage?.name}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : selectedBackground ? (
                      <Image 
                        src={selectedBackground.path} 
                        alt={selectedBackground.display_name}
                        fill
                        className="object-cover"
                        sizes="100vw"
                      />
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Default Background</p>
                        <p className="text-sm text-gray-500">Ocean Sunrise Golden will be used</p>
                      </div>
                    </div>
                  </div>
                  {/* Show default background preview - 16:9 aspect ratio, 70% width */}
                  <div className="mt-3 relative w-[70%] mx-auto rounded-lg overflow-hidden border border-gray-300" style={{ paddingBottom: '39.375%' }}>
                    <Image 
                      src="/images/ocean-sunrise-golden-worship-background.jpg" 
                      alt="Mountain Cross Sunset (Default)"
                      fill
                      className="object-cover"
                      sizes="70vw"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {scriptureError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm">{scriptureError}</p>
            </div>
          )}
          {scriptureSuccess && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800 text-sm">{scriptureSuccess}</p>
            </div>
          )}
        </div>
        </>
        )}

        {activeTab === 'doxology' && <DoxologyTab />}

        {activeTab === 'benediction' && <BenedictionTab />}

        {activeTab === 'postlude' && <PostludeTab />}
      </div>

      {/* Background Selector Modal */}
      {showBackgroundSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Choose Background Image</h2>
                <button
                  onClick={() => setShowBackgroundSelector(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {availableBackgrounds.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {availableBackgrounds.map((bg: any) => (
                    <div
                      key={bg.id}
                      className={`cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
                        selectedBackground?.id === bg.id 
                          ? 'border-blue-500 shadow-lg' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => {
                        setSelectedBackground(bg);
                        setBackgroundImage(null);
                        setShowBackgroundSelector(false);
                      }}
                    >
                      <div className="relative w-full h-32">
                        <Image 
                          src={bg.path} 
                          alt={bg.display_name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      </div>
                      <div className="p-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {bg.display_name}
                        </p>
                        <p className="text-xs text-gray-500">{bg.type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  No background images available.
                </p>
              )}
            </div>
            
            <div className="p-6 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowBackgroundSelector(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}