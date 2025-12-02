import React, { useMemo, useState, useRef } from 'react';
import PageBackground from '../components/PageBackground';
import Navbar from '../components/Navbar';
import { useAppData } from '../components/useAppData';

const OverlaysPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { overlays, uploadOverlay, deleteOverlay } = useAppData();

  const filteredOverlays = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return overlays;
    return overlays.filter((o) => o.title.toLowerCase().includes(q));
  }, [overlays, query]);

  const cardsToRender = useMemo(() => {
    return [
      { __addNew: true, id: -1, ownerId: -1, title: '', url: '' },
      ...filteredOverlays,
    ];
  }, [filteredOverlays]);

  const handleAddNewClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await uploadOverlay(file);

    if (result.success) {
      console.log('Overlay uploaded successfully');
    } else {
      alert(`Error uploading overlay: ${result.error}`);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this overlay?')) {
      return;
    }

    const result = await deleteOverlay(id);

    if (result.success) {
      console.log('Overlay deleted successfully');
    } else {
      alert(`Error deleting overlay: ${result.error}`);
    }
  };

  return (
    <PageBackground>
      <Navbar />
      <div className="flex w-full justify-center px-6 py-20 text-white">
        <div className="w-full max-w-[1200px] rounded-2xl bg-[#1f2733] shadow-[0_25px_60px_rgba(0,0,0,0.6)] border border-[rgba(255,255,255,0.07)] p-8 flex flex-col gap-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <h2 className="text-2xl font-semibold text-white">Overlays</h2>
            <div className="relative w-full max-w-[260px]">
              <input
                type="text"
                placeholder="Search overlays..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-lg bg-[#2b3442] border border-[rgba(255,255,255,0.12)] px-4 py-3 text-base text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                🔍
              </span>
            </div>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* overlays grid */}
          <div className="max-h-[75vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
              {cardsToRender.map((item) => {
                if ('__addNew' in item && item.__addNew) {
                  return (
                    <button
                      key="add-new"
                      onClick={handleAddNewClick}
                      className="flex h-[180px] flex-col items-center justify-center rounded-xl bg-[#3a3f46] text-white text-xl font-medium shadow-[0_10px_20px_rgba(0,0,0,0.7)] border border-[rgba(0,0,0,0.6)] hover:brightness-110 transition"
                    >
                      <div className="text-4xl leading-none font-semibold mb-2">
                        +
                      </div>
                      <div className="text-lg font-medium">Add new</div>
                    </button>
                  );
                }

                const preview = item.url || '/placeholder.png';
                return (
                  <div
                    key={item.id}
                    className="relative h-[180px] rounded-xl shadow-[0_10px_20px_rgba(0,0,0,0.7)] border border-[rgba(0,0,0,0.6)] overflow-hidden hover:brightness-110 transition group"
                    style={{
                      backgroundColor: '#000',
                      backgroundImage: `url(${preview})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    <div className="absolute inset-0 bg-[rgba(0,0,0,0.25)]" />
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="absolute top-2 right-2 z-20 bg-[rgba(0,0,0,0.55)] hover:bg-[rgba(255,0,0,0.8)] text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold transition leading-none"
                    >
                      ×
                    </button>
                    <div className="relative z-10 flex flex-col items-center justify-center h-full">
                      <span className="text-sm font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] px-3 py-1 rounded bg-[rgba(0,0,0,0.35)] mb-2">
                        {item.title}
                      </span>
                      <span className="text-lg font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] px-3 py-2 rounded bg-[rgba(0,0,0,0.35)]">
                        ID: {item.id}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </PageBackground>
  );
};

export default OverlaysPage;
