import React, { useState, FormEvent } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, senha);
      navigate("/");
    } catch (error: any) {
      alert("Erro ao cadastrar: " + error.message);
    }
  };

  return (
    <div className="login-register-container">
      <form onSubmit={handleRegister} className="login-register-form">
        <h2 className="text-2xl font-bold text-center">Criar Conta</h2>
        <input 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
          placeholder="Email" 
        />
        <input 
          type="password" 
          value={senha} 
          onChange={(e) => setSenha(e.target.value)} 
          required 
          placeholder="Senha" 
        />
        <button>Cadastrar</button>
      </form>
    </div>
  );
}