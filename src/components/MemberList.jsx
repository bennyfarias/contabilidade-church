import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import MemberForm from './MemberForm'; // Import MemberForm for editing

export default function MemberList() {
  const [members, setMembers] = useState([]);
  const [memberToEdit, setMemberToEdit] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'members'));
    const unsub = onSnapshot(q, (snapshot) => {
      setMembers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Deseja realmente excluir este membro?')) {
      await deleteDoc(doc(db, 'members', id));
    }
  };

  const handleEdit = (member) => {
    setMemberToEdit(member);
  };

  const handleSave = () => {
    setMemberToEdit(null);
  };

  return (
    <div className="lista">
      <h2>Membros</h2>
      {memberToEdit ? (
        <MemberForm memberToEdit={memberToEdit} onSave={handleSave} />
      ) : (
        <MemberForm onSave={handleSave} />
      )}
      <ul>
        {members.map((member) => (
          <li key={member.id}>
            {member.name} - {member.contact}
            <button onClick={() => handleEdit(member)}>✏️</button>
            <button onClick={() => handleDelete(member.id)}>🗑️</button>
          </li>
        ))}
      </ul>
    </div>
  );
}