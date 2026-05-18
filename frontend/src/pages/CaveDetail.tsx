import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchCave, fetchCaveMedia, type Cave, type CaveMedia } from '../api/caves';
import { DocumentArrowDownIcon, XMarkIcon, MapPinIcon } from '@heroicons/react/24/outline';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fixLeafletIcon } from '../utils/leafletIconFix';
import { downloadGpx, openMapsToParking } from '../utils/gpxExport';

fixLeafletIcon();

const geologyLabels: Record<string, string> = {
  limestone: 'Calcare',
  dolomite: 'Dolomia',
  gypsum: 'Gesso',
  other: 'Altro',
};

const DataCard = ({ label, value }: { label: string; value: string | number | null | undefined }) => {
  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">{label}</div>
      <div className={`font-medium ${value ? 'text-white' : 'text-slate-500'}`}>
        {value || '—'}
      </div>
    </div>
  );
};

const CaveDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [cave, setCave] = useState<Cave | null>(null);
  const [media, setMedia] = useState<CaveMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [caveData, mediaData] = await Promise.all([
          fetchCave(id),
          fetchCaveMedia(id),
        ]);
        setCave(caveData);
        setMedia(mediaData);
        setError(null);
      } catch (err) {
        console.error('Error fetching cave details:', err);
        setError('Grotta non trovata');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  useEffect(() => {
    if (!cave || !cave.latitude || !cave.longitude) return;

    const mapContainer = document.getElementById('mini-map');
    if (!mapContainer) return;

    const map = L.map(mapContainer, {
      center: [cave.latitude, cave.longitude],
      zoom: 13,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    L.marker([cave.latitude, cave.longitude]).bindTooltip('Ingresso', { permanent: false }).addTo(map);

    if (cave.parking_latitude != null && cave.parking_longitude != null) {
      const parkingIcon = L.divIcon({
        className: '',
        html: '<div style="background:#f59e0b;border:2px solid #fff;border-radius:50%;width:14px;height:14px;box-shadow:0 0 4px rgba(0,0,0,.5)"></div>',
        iconAnchor: [7, 7],
      });
      L.marker([cave.parking_latitude, cave.parking_longitude], { icon: parkingIcon })
        .bindTooltip(cave.parking_notes ?? 'Parcheggio', { permanent: false })
        .addTo(map);

      const bounds = L.latLngBounds(
        [cave.latitude, cave.longitude],
        [cave.parking_latitude, cave.parking_longitude],
      );
      map.fitBounds(bounds, { padding: [30, 30] });
    }

    return () => {
      map.remove();
    };
  }, [cave]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedImage(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !cave) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-2">Grotta non trovata</h2>
          <p className="text-slate-400 mb-8">La grotta richiesta non esiste o non è stata ancora pubblicata.</p>
          <Link to="/caves" className="text-teal-400 hover:text-teal-300 font-medium inline-flex items-center space-x-2">
            <span>← Torna all'elenco</span>
          </Link>
        </div>
      </div>
    );
  }

  const photos = media.filter(m => m.media_type === 'photo' || m.media_type === 'survey_image');
  const surveys = media.filter(m => m.media_type === 'survey_pdf');

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('it-IT');
  };

  const formatCoords = (val: number, dir: 'N' | 'E') => {
    return `${val.toFixed(6)}° ${dir}`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* 1. Header section */}
      <nav className="flex text-sm text-slate-400 mb-2 items-center space-x-2">
        <Link to="/caves" className="hover:text-white transition-colors">Grotte</Link>
        <span className="text-slate-600">/</span>
        <span className="truncate">{cave.name}</span>
      </nav>
      
      <h1 className="text-4xl font-bold text-white mt-2 mb-1">{cave.name}</h1>
      <div className="text-slate-400 text-sm">
        Codice catasto: {cave.registry_id}
        {cave.plaque_number && (
          <>  ·  Placchetta: {cave.plaque_number}</>
        )}
      </div>
      {!cave.is_published && (
        <span className="inline-block mt-2 px-2 py-0.5 bg-slate-700 text-slate-300 text-xs font-semibold rounded uppercase tracking-wider">
          Bozza
        </span>
      )}

      {/* 2. Technical data grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
        <DataCard label="Quota ingresso" value={cave.elevation ? `${cave.elevation} m s.l.m.` : null} />
        <DataCard label="Estensione spaziale" value={cave.length ? `${cave.length} m` : null} />
        <DataCard label="Estensione verticale positiva" value={cave.depth_positive ? `${cave.depth_positive} m` : null} />
        <DataCard label="Estensione verticale negativa" value={cave.depth_negative ? `${cave.depth_negative} m` : null} />
        <DataCard label="Geologia" value={cave.geology ? geologyLabels[cave.geology] : null} />
        <DataCard label="Comune" value={cave.municipality} />
        <DataCard label="Valle" value={cave.valley} />
        <DataCard label="Ultimo rilievo" value={cave.last_survey_date ? formatDate(cave.last_survey_date) : null} />
        <DataCard label="Aggiornata il" value={formatDate(cave.updated_at)} />
      </div>

      {cave.description && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-white mb-3">Descrizione</h2>
          <div className="text-slate-300 leading-relaxed whitespace-pre-wrap">{cave.description}</div>
        </div>
      )}

      {/* 3. Mini map section */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold text-white mb-3">Posizione</h2>
        <div id="mini-map" className="h-64 w-full rounded-xl overflow-hidden border border-slate-700 shadow-lg" />
        {cave.latitude && cave.longitude && (
          <div className="text-slate-400 text-sm text-right mt-2">
            {formatCoords(cave.latitude, 'N')}, {formatCoords(cave.longitude, 'E')}
          </div>
        )}

        {/* GPS / Navigation export */}
        <div className="flex flex-wrap gap-3 mt-4">
          <button
            onClick={() => downloadGpx(cave)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors border border-slate-600"
            title="Scarica traccia GPX con parcheggio e ingresso per GPS"
          >
            <DocumentArrowDownIcon className="w-4 h-4 text-teal-400" />
            Scarica GPX
          </button>
          <button
            onClick={() => openMapsToParking(cave)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors border border-slate-600"
            title={cave.parking_latitude != null ? 'Apri navigazione verso il parcheggio' : 'Apri navigazione verso l\'ingresso'}
          >
            <MapPinIcon className="w-4 h-4 text-amber-400" />
            {cave.parking_latitude != null ? 'Naviga al parcheggio' : 'Naviga all\'ingresso'}
          </button>
        </div>
        {cave.parking_notes && (
          <div className="mt-2 text-sm text-slate-400 italic">
            📍 {cave.parking_notes}
          </div>
        )}
      </div>

      {/* 4. Media section */}
      {media.length > 0 && (
        <div className="mt-10">
          {photos.length > 0 && (
            <>
              <h2 className="text-lg font-semibold text-white mb-4">Galleria fotografica</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {photos.map((item) => (
                  <div key={item.id} className="group">
                    <img
                      src={item.file_url}
                      alt={item.caption ?? cave.name}
                      className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setSelectedImage(item.file_url)}
                    />
                    {item.caption && (
                      <div className="text-xs text-slate-400 mt-1 truncate">{item.caption}</div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {surveys.length > 0 && (
            <div className={photos.length > 0 ? "mt-10" : ""}>
              <h2 className="text-lg font-semibold text-white mb-4">Rilievi</h2>
              <div className="space-y-3">
                {surveys.map((item) => (
                  <a
                    key={item.id}
                    href={item.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-slate-800 rounded-lg px-4 py-3 hover:bg-slate-700 transition-colors group"
                  >
                    <DocumentArrowDownIcon className="text-teal-400 w-5 h-5 flex-shrink-0" />
                    <div className="flex-grow min-w-0">
                      <div className="text-white font-medium truncate">
                        {item.file_url.split('/').pop()}
                      </div>
                      {item.caption && (
                        <div className="text-slate-400 text-sm truncate">{item.caption}</div>
                      )}
                    </div>
                    <div className="text-slate-500 text-xs flex-shrink-0">
                      {formatDate(item.uploaded_at)}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lightbox */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-6 right-6 text-white hover:text-slate-300 transition-colors"
            onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
          >
            <XMarkIcon className="w-8 h-8" />
          </button>
          <img 
            src={selectedImage} 
            alt="Enlarged view" 
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default CaveDetail;
