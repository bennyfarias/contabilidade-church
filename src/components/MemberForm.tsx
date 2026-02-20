import React, { useState, useEffect, FormEvent } from 'react';
import { Member } from '../types';
import { MemberService } from '../services/memberService';

interface MemberFormProps {
  memberToEdit?: Member | null;
  onSave: () => void;
  onCancel: () => void;
}

export default function MemberForm({ memberToEdit, onSave, onCancel }: MemberFormProps) {
  // Form State
  const [name, setName] = useState<string>('');
  const [contact, setContact] = useState<string>('');
  const [isJointTithe, setIsJointTithe] = useState<boolean>(false);
  const [jointTithePartnerName, setJointTithePartnerName] = useState<string>('');
  
  // UI State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Initialize form when editing
  useEffect(() => {
    if (memberToEdit) {
      setName(memberToEdit.name);
      setContact(memberToEdit.contact || '');
      setIsJointTithe(memberToEdit.isJointTithe || false);
      setJointTithePartnerName(memberToEdit.jointTithePartnerName || '');
    } else {
      resetForm();
    }
  }, [memberToEdit]);

  const resetForm = () => {
    setName('');
    setContact('');
    setIsJointTithe(false);
    setJointTithePartnerName('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      alert('O nome do membro é obrigatório.');
      return;
    }

    setIsSubmitting(true);

    const memberData = {
      name,
      contact,
      isJointTithe,
      jointTithePartnerName: isJointTithe ? jointTithePartnerName : ''
    };

    try {
      if (memberToEdit && memberToEdit.id) {
        await MemberService.update(memberToEdit.id, memberData);
      } else {
        await MemberService.create(memberData);
      }
      onSave(); // Refresh list or close modal
    } catch (error) {
      console.error("Error saving member:", error);
      alert("Erro ao salvar membro. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form">
      <div className="input-with-icon">
        <input 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          placeholder="Nome completo do Membro" 
          required 
          disabled={isSubmitting}
        />
        <i className="fas fa-user icon-inside-input"></i>
      </div>

      <div className="input-with-icon">
        <input 
          value={contact} 
          onChange={(e) => setContact(e.target.value)} 
          placeholder="Contato (Email/Telefone)" 
          disabled={isSubmitting}
        />
        <i className="fas fa-phone-alt icon-inside-input"></i>
      </div>

      <div className="form-group-inline installment-toggle-group">
        <label className="checkbox-container" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={isJointTithe} 
            onChange={(e) => setIsJointTithe(e.target.checked)} 
            disabled={isSubmitting}
          />
          <span className="checkbox-label">Este membro contribui em conjunto?</span>
        </label>
      </div>

      {isJointTithe && (
        <div className="input-with-icon">
          <input 
            value={jointTithePartnerName} 
            onChange={(e) => setJointTithePartnerName(e.target.value)} 
            placeholder="Nome do Cônjuge/Parceiro(a)" 
            required={isJointTithe} 
            disabled={isSubmitting}
          />
          <i className="fas fa-user-friends icon-inside-input"></i>
        </div>
      )}

      <div className="form-actions" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <button type="submit" className="button-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : (memberToEdit ? 'Salvar Alterações' : 'Adicionar Membro')}
        </button>
        
        <button 
          type="button" 
          onClick={onCancel} 
          className="button-secondary cancel-btn"
          disabled={isSubmitting}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}