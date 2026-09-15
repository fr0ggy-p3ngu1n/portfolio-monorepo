import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import type { Project, ContactSubmission } from '@portfolio/shared';
import AnalyticsSection from './AnalyticsSection';

const RESUME_URL = `${import.meta.env.VITE_API_URL ?? ''}/api/resume`;

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [contacts, setContacts] = useState<ContactSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeStatus, setResumeStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [resumeError, setResumeError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);

  // Admin fetches ALL projects (including drafts), ordered by their saved
  // order — GET /api/projects/all is the admin-only listing; the public
  // GET /api/projects only ever returns published: true.
  useEffect(() => {
    Promise.allSettled([
      api.get<Project[]>('/api/projects/all'),
      api.get<ContactSubmission[]>('/api/contact'),
    ])
      .then(([p, c]) => {
        if (p.status === 'fulfilled') setProjects(p.value);
        if (c.status === 'fulfilled') setContacts(c.value);
      })
      .finally(() => setLoading(false));
  }, []);

  const deleteProject = async (id: string) => {
    if (!confirm('Delete this project?')) return;
    setActionError('');
    try {
      await api.delete(`/api/projects/${id}`);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete project');
    }
  };

  const handleDrop = async (targetId: string) => {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }
    const fromIndex = projects.findIndex((p) => p.id === draggedId);
    const toIndex = projects.findIndex((p) => p.id === targetId);
    if (fromIndex === -1 || toIndex === -1) {
      setDraggedId(null);
      return;
    }

    const reordered = [...projects];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    const withNewOrder = reordered.map((p, i) => ({ ...p, order: i }));
    const previous = projects;
    setProjects(withNewOrder); // optimistic
    setDraggedId(null);
    setReordering(true);
    setActionError('');

    try {
      await Promise.all(
        withNewOrder.map((p) => api.put(`/api/projects/${p.id}`, { order: p.order })),
      );
    } catch (err) {
      setProjects(previous); // revert on failure
      setActionError(err instanceof Error ? err.message : 'Failed to save new order');
    } finally {
      setReordering(false);
    }
  };

  const handleResumeUpload = async () => {
    if (!resumeFile) return;
    setResumeStatus('uploading');
    setResumeError('');
    try {
      const formData = new FormData();
      formData.append('resume', resumeFile);
      await api.upload('/api/resume', formData);
      setResumeStatus('success');
      setResumeFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setResumeError(err instanceof Error ? err.message : 'Upload failed');
      setResumeStatus('error');
    }
  };

  const markRead = async (id: string) => {
    setActionError('');
    try {
      await api.put(`/api/contact/${id}/read`, {});
      setContacts((prev) =>
        prev.map((c) => (c.id === id ? { ...c, read: true } : c)),
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to mark as read');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-16 text-gray-500">Loading…</div>
    );
  }

  return (
    <div className="space-y-12">
      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {actionError}
        </div>
      )}

      <AnalyticsSection />

      {/* ── Resume ── */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Resume</h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-1">
            Upload a new PDF to instantly replace the resume download on the site.
          </p>
          <a
            href={RESUME_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            View current resume ↗
          </a>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={(e) => {
                setResumeFile(e.target.files?.[0] ?? null);
                setResumeStatus('idle');
              }}
              className="text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 file:cursor-pointer"
            />
            <button
              onClick={handleResumeUpload}
              disabled={!resumeFile || resumeStatus === 'uploading'}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {resumeStatus === 'uploading' ? 'Uploading…' : 'Upload'}
            </button>
            {resumeStatus === 'success' && (
              <span className="text-sm text-green-600 font-medium">✓ Resume updated</span>
            )}
            {resumeStatus === 'error' && (
              <span className="text-sm text-red-600">{resumeError}</span>
            )}
          </div>
        </div>
      </section>

      {/* ── Projects ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Projects
            {reordering && (
              <span className="ml-2 text-xs font-normal text-gray-400">Saving order…</span>
            )}
          </h2>
          <Link
            to="/admin/projects/new"
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add project
          </Link>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {projects.length === 0 ? (
            <p className="text-center py-10 text-gray-500">
              No projects yet — add one above.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="w-8"></th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Title</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Featured</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {projects.map((p) => (
                  <tr
                    key={p.id}
                    draggable
                    onDragStart={() => setDraggedId(p.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(p.id)}
                    className={draggedId === p.id ? 'opacity-40' : ''}
                  >
                    <td className="pl-3 text-gray-300 cursor-grab select-none" title="Drag to reorder">⠿</td>
                    <td className="px-4 py-3 text-gray-900">{p.title}</td>
                    <td className="px-4 py-3">
                      {p.published ? (
                        <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">Published</span>
                      ) : (
                        <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">Draft</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {p.featured ? 'Yes' : '—'}
                    </td>
                    <td className="px-4 py-3 text-right space-x-4">
                      <Link
                        to={`/admin/projects/${p.id}/edit`}
                        className="text-blue-600 hover:underline"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => deleteProject(p.id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* ── Contact submissions ── */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Contact Submissions
        </h2>
        {contacts.length === 0 ? (
          <p className="text-gray-500">No submissions yet.</p>
        ) : (
          <div className="space-y-3">
            {contacts.map((c) => (
              <div
                key={c.id}
                className={`bg-white rounded-xl border p-4 ${
                  c.read ? 'border-gray-200' : 'border-blue-300'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {c.name}{' '}
                      <span className="font-normal text-gray-500">
                        ({c.email})
                      </span>
                    </p>
                    <p className="text-sm text-gray-600 mt-1">{c.message}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(c.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {!c.read && (
                    <button
                      onClick={() => markRead(c.id)}
                      className="shrink-0 text-xs text-blue-600 hover:underline"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
