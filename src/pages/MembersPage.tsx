import React, { useState, useEffect } from 'react';
import MemberForm from '../components/MemberForm'; // Mantenha o componente de form (pode deixar simples por enquanto)
import { MemberService } from '../services/memberService';
import { Member } from '../types';
import { Search, UserPlus, Users, Edit, Trash2, Phone } from 'lucide-react';

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [memberToEdit, setMemberToEdit] = useState<Member | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const data = await MemberService.getAll();
      setMembers(data);
      setFilteredMembers(data);
    } catch (error) { console.error(error); } 
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchMembers(); }, []);

  useEffect(() => {
    const lower = searchQuery.toLowerCase();
    setFilteredMembers(members.filter(m => m.name.toLowerCase().includes(lower)));
  }, [searchQuery, members]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Excluir membro?')) {
      await MemberService.delete(id);
      fetchMembers();
    }
  };

  const handleSaveSuccess = () => { setIsModalOpen(false); setMemberToEdit(null); fetchMembers(); };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Membros</h1>
          <p className="text-slate-500">Gerencie o cadastro de membros</p>
        </div>
        <button 
          onClick={() => { setMemberToEdit(null); setIsModalOpen(true); }}
          className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm"
        >
          <UserPlus size={18} /> Novo Membro
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar por nome..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Nome</th>
                <th className="px-6 py-4">Contato</th>
                <th className="px-6 py-4">Status Dízimo</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={4} className="p-8 text-center text-slate-500">Carregando...</td></tr>
              ) : filteredMembers.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-slate-500">Nenhum membro encontrado.</td></tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{member.name}</td>
                    <td className="px-6 py-4 text-slate-500 flex items-center gap-2">
                      {member.contact ? <><Phone size={14}/> {member.contact}</> : '-'}
                    </td>
                    <td className="px-6 py-4">
                      {member.isJointTithe ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                          <Users size={12} /> Conjunto ({member.jointTithePartnerName})
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                          Individual
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => { setMemberToEdit(member); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(member.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Overlay Simplificado */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">{memberToEdit ? 'Editar Membro' : 'Novo Membro'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="p-6">
              <MemberForm memberToEdit={memberToEdit} onSave={handleSaveSuccess} onCancel={() => setIsModalOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}