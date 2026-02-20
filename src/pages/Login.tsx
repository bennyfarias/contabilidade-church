import React, { useState, FormEvent } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, ArrowRight } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, senha);
      navigate('/');
    } catch (error: any) {
      alert('Erro ao logar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8 border border-slate-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Bem-vindo</h1>
          <p className="text-slate-500 mt-2">Acesse o sistema financeiro</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-slate-400" size={20} />
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-all"
                placeholder="seu@email.com"
                required 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-400" size={20} />
              <input 
                type="password" 
                value={senha} 
                onChange={(e) => setSenha(e.target.value)} 
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
                required 
              />
            </div>
          </div>

          <button 
            disabled={loading}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? 'Entrando...' : 'Entrar no Sistema'}
            {!loading && <ArrowRight size={20} />}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          Não tem conta? <Link to="/register" className="text-sky-600 font-semibold hover:underline">Crie uma aqui</Link>
        </div>
      </div>
    </div>
  );
}