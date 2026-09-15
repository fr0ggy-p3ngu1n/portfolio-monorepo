import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import type { Project } from '@portfolio/shared';

type FormState = {
  title: string;
  description: string;
  url: string;
  repoUrl: string;
  imageUrl: string;
  tags: string;
  featured: boolean;
  published: boolean;
  order: number;
};

const EMPTY: FormState = {
  title: '',
  description: '',
  url: '',
  repoUrl: '',
  imageUrl: '',
  tags: '',
  featured: false,
  published: true,
  order: 0,
};

export default function ProjectForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    api
      .get<Project>(`/api/projects/${id}`)
      .then((p) => {
        setForm({
          title: p.title,
          description: p.description,
          url: p.url ?? '',
          repoUrl: p.repoUrl ?? '',
          imageUrl: p.imageUrl ?? '',
          tags: Array.isArray(p.tags) ? p.tags.join(', ') : '',
          featured: p.featured,
          published: p.published,
          order: p.order,
        });
      })
      .catch((err) => {
        // Deliberately don't fall through to an editable empty form here —
        // that would let a transient load failure turn into a submit that
        // silently overwrites the real project with blank data.
        setLoadError(err instanceof Error ? err.message : 'Failed to load project');
      })
      .finally(() => setFetching(false));
  }, [id]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const payload = {
      title: form.title,
      description: form.description,
      url: form.url || null,
      repoUrl: form.repoUrl || null,
      imageUrl: form.imageUrl || null,
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      featured: form.featured,
      published: form.published,
      order: form.order,
    };
    try {
      if (isEdit) {
        await api.put(`/api/projects/${id}`, payload);
      } else {
        await api.post('/api/projects', payload);
      }
      navigate('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="text-center py-12 text-gray-500">Loading…</div>;
  }

  if (loadError) {
    return (
      <div className="max-w-2xl text-center py-12">
        <p className="text-red-600 mb-4">Couldn't load this project: {loadError}</p>
        <button
          onClick={() => navigate('/admin')}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Back to dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEdit ? 'Edit Project' : 'New Project'}
      </h1>
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl border border-gray-200 p-6 space-y-5"
      >
        {/* Title */}
        <Field label="Title *">
          <input
            type="text"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            className={inputCls}
            required
          />
        </Field>

        {/* Description */}
        <Field label="Description *">
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            rows={4}
            className={inputCls}
            required
          />
        </Field>

        {/* URLs */}
        <Field label="Live URL">
          <input
            type="url"
            value={form.url}
            onChange={(e) => set('url', e.target.value)}
            placeholder="https://example.com"
            className={inputCls}
          />
        </Field>
        <Field label="Repo URL">
          <input
            type="url"
            value={form.repoUrl}
            onChange={(e) => set('repoUrl', e.target.value)}
            placeholder="https://github.com/you/repo"
            className={inputCls}
          />
        </Field>
        <Field label="Image URL">
          <input
            type="url"
            value={form.imageUrl}
            onChange={(e) => set('imageUrl', e.target.value)}
            placeholder="https://..."
            className={inputCls}
          />
        </Field>

        {/* Tags */}
        <Field label="Tags (comma-separated)">
          <input
            type="text"
            value={form.tags}
            onChange={(e) => set('tags', e.target.value)}
            placeholder="React, TypeScript, Tailwind"
            className={inputCls}
          />
        </Field>

        {/* Order */}
        <Field label="Display Order">
          <input
            type="number"
            value={form.order}
            onChange={(e) => set('order', Number(e.target.value))}
            className={inputCls}
          />
        </Field>

        {/* Featured */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="featured"
            checked={form.featured}
            onChange={(e) => set('featured', e.target.checked)}
            className="rounded"
          />
          <label htmlFor="featured" className="text-sm font-medium text-gray-700">
            Featured project
          </label>
        </div>

        {/* Published */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="published"
            checked={form.published}
            onChange={(e) => set('published', e.target.checked)}
            className="rounded"
          />
          <label htmlFor="published" className="text-sm font-medium text-gray-700">
            Published <span className="font-normal text-gray-500">(unpublished projects are hidden from the public site, but you can still preview and edit them here)</span>
          </label>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Saving…' : isEdit ? 'Update' : 'Create'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

const inputCls =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
