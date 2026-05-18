import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as cavesApi from '../api/caves';
import type { CaveWritePayload, CaveMedia, ApiError } from '../api/caves';
import { ArrowLeftIcon, CloudArrowUpIcon, TrashIcon, DocumentIcon, PhotoIcon, MapIcon } from '@heroicons/react/20/solid';

const CaveForm: React.FC = () => {
  const params = useParams();
  const id = params.id;
  const isEditMode = !!id;
  const navigate = useNavigate();

  const [formData, setFormData] = useState<CaveWritePayload>({
    registry_id: '',
    plaque_number: '',
    name: '',
    latitude: 46.0,
    longitude: 11.0,
    elevation: null,
    length: null,
    depth_positive: null,
    depth_negative: null,
    municipality: '',
    valley: '',
    geology: null,
    description: '',
    last_survey_date: '',
    parking_latitude: null,
    parking_longitude: null,
    parking_notes: '',
    is_published: true,
  });

  const [media, setMedia] = useState<CaveMedia[]>([]);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<'photo' | 'survey_pdf' | 'survey_image'>('photo');
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (isEditMode && id) {
      const loadData = async () => {
        setIsLoading(true);
        try {
          const [caveData, mediaData] = await Promise.all([
            cavesApi.fetchCave(id),
            cavesApi.fetchCaveMedia(id)
          ]);
          
          setFormData({
            registry_id: caveData.registry_id,
            plaque_number: caveData.plaque_number || '',
            name: caveData.name,
            latitude: caveData.latitude ?? 0,
            longitude: caveData.longitude ?? 0,
            elevation: caveData.elevation,
            length: caveData.length,
            depth_positive: caveData.depth_positive,
            depth_negative: caveData.depth_negative,
            municipality: caveData.municipality || '',
            valley: caveData.valley || '',
            geology: caveData.geology as CaveWritePayload['geology'],
            description: caveData.description || '',
            last_survey_date: caveData.last_survey_date || '',
            parking_latitude: caveData.parking_latitude ?? null,
            parking_longitude: caveData.parking_longitude ?? null,
            parking_notes: caveData.parking_notes || '',
            is_published: caveData.is_published,
          });
          setMedia(mediaData);
          setError(null);
        } catch (err) {
          console.error('Error loading cave data:', err);
          setError('Errore durante il caricamento dei dati della grotta.');
        } finally {
          setIsLoading(false);
        }
      };
      loadData();
    }
  }, [isEditMode, id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: val === '' ? (type === 'number' ? null : '') : (type === 'number' ? parseFloat(value) : val)
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setFieldErrors({});

    try {
      if (isEditMode && id) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { registry_id, ...updateData } = formData;
        await cavesApi.updateCave(id, updateData);
      } else {
        await cavesApi.createCave(formData);
      }
      navigate('/dashboard');
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      if (apiErr.data) {
        setFieldErrors(apiErr.data);
      } else {
        setError('Errore durante il salvataggio della grotta.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !id) return;

    setIsUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', uploadFile);
    formDataUpload.append('media_type', mediaType);
    if (caption) formDataUpload.append('caption', caption);

    try {
      const newMedia = await cavesApi.uploadMedia(id, formDataUpload);
      setMedia(prev => [...prev, newMedia]);
      setUploadFile(null);
      setCaption('');
      const fileInput = document.getElementById('media-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err) {
      console.error('Error uploading media:', err);
      alert('Errore durante l\'upload.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteMedia = async (mediaId: number) => {
    if (!window.confirm("Eliminare questo file?")) return;
    try {
      await cavesApi.deleteMedia(mediaId);
      setMedia(prev => prev.filter(m => m.id !== mediaId));
    } catch (err) {
      console.error('Error deleting media:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent"></div>
      </div>
    );
  }

  const inputClass = "w-full bg-slate-900 border border-slate-600 text-white placeholder-slate-500 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all";
  const labelClass = "block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 ml-1";

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-24">
      <div className="flex items-center space-x-4 mb-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <h1 className="text-3xl font-bold text-white">
          {isEditMode ? 'Modifica grotta' : 'Nuova grotta'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-800 rounded-xl p-8 border border-slate-700 shadow-2xl space-y-8">
        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-1">
            <label className={labelClass}>Numero di catasto *</label>
            <input
              type="text"
              name="registry_id"
              value={formData.registry_id}
              onChange={handleChange}
              disabled={isEditMode}
              className={`${inputClass} ${isEditMode ? 'bg-slate-700 text-slate-400 cursor-not-allowed border-slate-600' : ''}`}
              required
            />
            {fieldErrors.registry_id && <p className="text-red-400 text-xs mt-1">{fieldErrors.registry_id[0]}</p>}
          </div>

          <div className="md:col-span-1">
            <label className={labelClass}>Numero placchetta</label>
            <input
              type="text"
              name="plaque_number"
              value={formData.plaque_number || ''}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Nome grotta *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={inputClass}
              required
            />
            {fieldErrors.name && <p className="text-red-400 text-xs mt-1">{fieldErrors.name[0]}</p>}
          </div>

          <div>
            <label className={labelClass}>Latitudine *</label>
            <input
              type="number"
              step="any"
              name="latitude"
              value={formData.latitude}
              onChange={handleChange}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Longitudine *</label>
            <input
              type="number"
              step="any"
              name="longitude"
              value={formData.longitude}
              onChange={handleChange}
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className={labelClass}>Quota ingresso (m)</label>
            <input
              type="number"
              name="elevation"
              value={formData.elevation ?? ''}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Sviluppo spaziale (m)</label>
            <input
              type="number"
              name="length"
              value={formData.length ?? ''}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Dislivello + (m)</label>
            <input
              type="number"
              name="depth_positive"
              value={formData.depth_positive ?? ''}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Dislivello - (m)</label>
            <input
              type="number"
              name="depth_negative"
              value={formData.depth_negative ?? ''}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Comune</label>
            <input
              type="text"
              name="municipality"
              value={formData.municipality || ''}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Valle</label>
            <input
              type="text"
              name="valley"
              value={formData.valley || ''}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Geologia *</label>
            <select
              name="geology"
              value={formData.geology || ''}
              onChange={handleChange}
              className={inputClass}
              required
            >
              <option value="">Seleziona...</option>
              <option value="limestone">Calcare</option>
              <option value="dolomite">Dolomia</option>
              <option value="gypsum">Gesso</option>
              <option value="other">Altro</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Data ultima modifica *</label>
            <input
              type="date"
              name="last_survey_date"
              value={formData.last_survey_date || ''}
              onChange={handleChange}
              className={inputClass}
              required
            />
          </div>

          <div className="md:col-span-2">
            <div className="border-t border-slate-700 pt-6 pb-2">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Parcheggio (opzionale)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Latitudine parcheggio</label>
                  <input
                    type="number"
                    step="any"
                    name="parking_latitude"
                    value={formData.parking_latitude ?? ''}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="es. 46.123456"
                  />
                </div>
                <div>
                  <label className={labelClass}>Longitudine parcheggio</label>
                  <input
                    type="number"
                    step="any"
                    name="parking_longitude"
                    value={formData.parking_longitude ?? ''}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="es. 11.123456"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Note parcheggio</label>
                  <input
                    type="text"
                    name="parking_notes"
                    value={formData.parking_notes || ''}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="es. Parcheggio sterrato vicino al bivio"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Descrizione</label>
            <textarea
              name="description"
              rows={4}
              value={formData.description || ''}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center space-x-3 cursor-pointer group">
              <input
                type="checkbox"
                name="is_published"
                checked={formData.is_published}
                onChange={handleChange}
                className="w-5 h-5 bg-slate-900 border-slate-600 rounded text-teal-500 focus:ring-teal-500 transition-all"
              />
              <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                Pubblica nel catasto (visibile a tutti)
              </span>
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-4 border-t border-slate-700">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-lg shadow-teal-500/10 transition-all"
          >
            {isSubmitting ? 'Salvataggio...' : 'Salva grotta'}
          </button>
        </div>
      </form>

      {isEditMode && (
        <div className="mt-12 pt-12 border-t border-slate-700">
          <h2 className="text-2xl font-bold text-white mb-6">Gestione media</h2>
          
          <div className="space-y-4 mb-8">
            {media.length === 0 ? (
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center text-slate-500 italic">
                Nessun file multimediale caricato per questa grotta.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {media.map(item => (
                  <div key={item.id} className="bg-slate-800 border border-slate-700 rounded-lg px-5 py-3 flex items-center justify-between group hover:border-slate-500 transition-all">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-lg ${
                        item.media_type === 'photo' ? 'bg-blue-900/30 text-blue-400' : 
                        item.media_type === 'survey_pdf' ? 'bg-red-900/30 text-red-400' : 'bg-purple-900/30 text-purple-400'
                      }`}>
                        {item.media_type === 'photo' ? <PhotoIcon className="w-5 h-5" /> : 
                         item.media_type === 'survey_pdf' ? <DocumentIcon className="w-5 h-5" /> : <MapIcon className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{item.caption || 'Senza titolo'}</div>
                        <div className="text-xs text-slate-500">{item.media_type.replace('_', ' ')}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <a href={item.file_url} target="_blank" rel="noreferrer" className="text-teal-400 hover:text-teal-300 text-xs font-bold uppercase tracking-wider">Apri</a>
                      <button onClick={() => handleDeleteMedia(item.id)} className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-400/10 transition-all">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={handleUpload} className="bg-slate-800/50 border border-dashed border-slate-600 rounded-xl p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className={labelClass}>Tipo file</label>
                <select
                  value={mediaType}
                  onChange={(e) => setMediaType(e.target.value as 'photo' | 'survey_pdf' | 'survey_image')}
                  className={inputClass}
                >
                  <option value="photo">Fotografia</option>
                  <option value="survey_pdf">Rilievo (PDF)</option>
                  <option value="survey_image">Rilievo (Immagine)</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Didascalia</label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className={inputClass}
                  placeholder="E es. Veduta dall'esterno"
                />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Seleziona file</label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-700 border-dashed rounded-lg cursor-pointer bg-slate-900 hover:bg-slate-800 transition-all">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <CloudArrowUpIcon className="w-8 h-8 text-slate-500 mb-2" />
                      <p className="text-sm text-slate-400 text-center px-4">
                        {uploadFile ? <span className="text-teal-400 font-semibold">{uploadFile.name}</span> : 'Trascina o clicca per caricare un file'}
                      </p>
                    </div>
                    <input id="media-file" type="file" className="hidden" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isUploading || !uploadFile}
                className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-bold rounded-lg transition-all"
              >
                {isUploading ? 'Caricamento...' : 'Carica file'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CaveForm;
