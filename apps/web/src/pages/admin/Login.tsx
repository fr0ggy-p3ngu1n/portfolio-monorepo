import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LOTR_ERRORS = [
  'You shall not pass! — Gandalf the Grey',
  'Even the very wise cannot see all ends. But they can tell when a password is wrong.',
  'Three Rings for the Elven-kings… and zero correct passwords for you.',
  'I would not take the One Ring if it were lying by the highway. Or apparently the right password.',
  'Fly, you fool! (And try a different password.)',
];

export default function Login() {
  const [password, setPassword]   = useState('');
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [failCount, setFailCount] = useState(0);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(password);
      navigate('/admin');
    } catch (err) {
      // Rate-limit responses have their own real message ("Too many
      // attempts...") — showing that plainly is more useful than pretending
      // it's just another wrong password.
      const message = err instanceof Error ? err.message : '';
      if (message.startsWith('Too many attempts')) {
        setError(message);
        setLoading(false);
        return;
      }
      const next = failCount + 1;
      setFailCount(next);
      if (next >= 3) {
        const idx = (next - 3) % LOTR_ERRORS.length;
        setError(LOTR_ERRORS[idx]);
      } else {
        setError('Invalid password');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base">
      <div className="glass w-full max-w-sm rounded-xl shadow-2xl p-8">
        <h1 className="text-2xl font-bold text-slate-100 mb-6 text-center">
          Admin Login
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-300 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 glass rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all"
              required
              autoFocus
            />
          </div>
          {error && (
            <p className={`text-sm ${failCount >= 3 ? 'text-pink-400 font-serif italic' : 'text-red-400'}`}>
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="glass-accent w-full py-2 px-4 text-pink-200 font-semibold rounded-xl hover:text-pink-100 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>
      </div>
    </div>
  );
}
