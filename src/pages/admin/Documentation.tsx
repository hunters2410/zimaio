import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  BookOpen, Download, Search, ChevronRight, Menu, X,
  Rocket, Layout, Users, Store, Package, ShoppingCart,
  CreditCard, DollarSign, Truck, BarChart, Mail, Zap,
  Shield, Database, Languages, Code
} from 'lucide-react';

interface DocumentationSection {
  id: string;
  title: string;
  slug: string;
  content: string;
  order_index: number;
  icon: string;
  is_published: boolean;
}

const iconMap: Record<string, any> = {
  Rocket, Layout, Users, Store, Package, ShoppingCart,
  CreditCard, DollarSign, Truck, BarChart, Mail, Zap,
  Shield, Database, Languages, Code
};

export default function Documentation() {
  const [sections, setSections] = useState<DocumentationSection[]>([]);
  const [activeSection, setActiveSection] = useState<DocumentationSection | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    loadDocumentation();
  }, []);

  async function loadDocumentation() {
    try {
      const { data, error } = await supabase
        .from('documentation_sections')
        .select('*')
        .eq('is_published', true)
        .order('order_index');

      if (error) throw error;

      setSections(data || []);
      if (data && data.length > 0) {
        setActiveSection(data[0]);
      }
    } catch (error) {
      console.error('Error loading documentation:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredSections = sections.filter(section =>
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDownloadPDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 shadow-md border-b border-slate-200 dark:border-slate-700 print:shadow-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 print:hidden"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <img
                src="/zimaio_mineral_edition,_no_background_v1.2.png"
                alt="Platform Logo"
                className="h-12 w-auto"
              />
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center">
                  <BookOpen className="w-8 h-8 mr-3 text-blue-600" />
                  System Documentation
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Complete guide to your multi-vendor e-commerce platform
                </p>
              </div>
            </div>

            <button
              onClick={handleDownloadPDF}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors print:hidden"
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </button>
          </div>

          {/* Search Bar */}
          <div className="mt-6 print:hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search documentation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <aside className={`${sidebarOpen ? 'block' : 'hidden'} lg:block w-full lg:w-80 flex-shrink-0 print:hidden`}>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 sticky top-8">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                  Table of Contents
                </h2>
                <nav className="space-y-1">
                  {filteredSections.map((section) => {
                    const IconComponent = iconMap[section.icon] || BookOpen;
                    return (
                      <button
                        key={section.id}
                        onClick={() => {
                          setActiveSection(section);
                          if (window.innerWidth < 1024) {
                            setSidebarOpen(false);
                          }
                        }}
                        className={`w-full flex items-center px-4 py-3 rounded-lg transition-all ${
                          activeSection?.id === section.id
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-l-4 border-blue-600'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border-l-4 border-transparent'
                        }`}
                      >
                        <IconComponent className="w-5 h-5 mr-3 flex-shrink-0" />
                        <span className="text-left flex-1 font-medium">{section.title}</span>
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </aside>

          {/* Content Area */}
          <main className="flex-1 min-w-0">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 print:shadow-none print:border-0">
              {activeSection ? (
                <article className="p-8 sm:p-12">
                  <div className="prose prose-slate dark:prose-invert max-w-none">
                    {/* Render the content with proper markdown formatting */}
                    {activeSection.content.split('\n').map((line, idx) => {
                      // Headers
                      if (line.startsWith('# ')) {
                        return (
                          <h1 key={idx} className="text-4xl font-bold text-slate-900 dark:text-white mt-8 mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
                            {line.substring(2)}
                          </h1>
                        );
                      }
                      if (line.startsWith('## ')) {
                        return (
                          <h2 key={idx} className="text-2xl font-bold text-slate-900 dark:text-white mt-8 mb-4">
                            {line.substring(3)}
                          </h2>
                        );
                      }
                      if (line.startsWith('### ')) {
                        return (
                          <h3 key={idx} className="text-xl font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-3">
                            {line.substring(4)}
                          </h3>
                        );
                      }
                      if (line.startsWith('#### ')) {
                        return (
                          <h4 key={idx} className="text-lg font-semibold text-slate-800 dark:text-slate-200 mt-4 mb-2">
                            {line.substring(5)}
                          </h4>
                        );
                      }

                      // Lists
                      if (line.match(/^\d+\.\s/)) {
                        return (
                          <li key={idx} className="ml-6 text-slate-700 dark:text-slate-300 mb-2">
                            {line.replace(/^\d+\.\s/, '')}
                          </li>
                        );
                      }
                      if (line.startsWith('- ') || line.startsWith('* ')) {
                        return (
                          <li key={idx} className="ml-6 text-slate-700 dark:text-slate-300 mb-2 list-disc">
                            {line.substring(2)}
                          </li>
                        );
                      }

                      // Bold text
                      if (line.includes('**')) {
                        const parts = line.split('**');
                        return (
                          <p key={idx} className="text-slate-700 dark:text-slate-300 mb-4 leading-relaxed">
                            {parts.map((part, i) =>
                              i % 2 === 1 ? <strong key={i} className="font-semibold text-slate-900 dark:text-white">{part}</strong> : part
                            )}
                          </p>
                        );
                      }

                      // Code blocks
                      if (line.startsWith('```')) {
                        return null; // Handle code blocks separately
                      }

                      // Empty lines
                      if (line.trim() === '') {
                        return <br key={idx} />;
                      }

                      // Regular paragraphs
                      return (
                        <p key={idx} className="text-slate-700 dark:text-slate-300 mb-4 leading-relaxed">
                          {line}
                        </p>
                      );
                    })}
                  </div>

                  {/* Navigation Footer */}
                  <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700 flex justify-between print:hidden">
                    <button
                      onClick={() => {
                        const currentIndex = sections.findIndex(s => s.id === activeSection.id);
                        if (currentIndex > 0) {
                          setActiveSection(sections[currentIndex - 1]);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                      disabled={sections.findIndex(s => s.id === activeSection.id) === 0}
                      className="flex items-center px-4 py-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4 mr-2 rotate-180" />
                      Previous
                    </button>
                    <button
                      onClick={() => {
                        const currentIndex = sections.findIndex(s => s.id === activeSection.id);
                        if (currentIndex < sections.length - 1) {
                          setActiveSection(sections[currentIndex + 1]);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                      disabled={sections.findIndex(s => s.id === activeSection.id) === sections.length - 1}
                      className="flex items-center px-4 py-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </button>
                  </div>
                </article>
              ) : (
                <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                  <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Select a section from the sidebar to view documentation</p>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            background: white !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:border-0 {
            border: 0 !important;
          }
          @page {
            margin: 2cm;
          }
        }
      `}</style>
    </div>
  );
}
