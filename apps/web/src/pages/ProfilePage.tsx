import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { studentsService } from '../services/students.service';
import { api } from '../services/api';
import { StudentProfile, ApiResponse } from '../types/api.types';

const emailSchema = z.object({ correo: z.string().email('Correo inválido') });
const pwSchema = z.object({
  passwordActual: z.string().min(1),
  passwordNueva: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
});

export function ProfilePage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [emailMsg, setEmailMsg] = useState('');
  const [pwMsg, setPwMsg] = useState('');

  const emailForm = useForm({ resolver: zodResolver(emailSchema) });
  const pwForm = useForm({ resolver: zodResolver(pwSchema) });

  useEffect(() => {
    studentsService.getProfile().then(setProfile);
  }, []);

  const onEmailSubmit = async (data: { correo: string }) => {
    setEmailMsg('');
    try {
      await api.patch<ApiResponse>('/users/me/email', data);
      setEmailMsg('Correo actualizado correctamente');
    } catch {
      setEmailMsg('Error al actualizar el correo');
    }
  };

  const onPwSubmit = async (data: { passwordActual: string; passwordNueva: string }) => {
    setPwMsg('');
    try {
      await api.patch<ApiResponse>('/users/me/password', data);
      setPwMsg('Contraseña actualizada correctamente');
      pwForm.reset();
    } catch {
      setPwMsg('Contraseña actual incorrecta');
    }
  };

  if (!profile) return <p className="text-gray-500">Cargando...</p>;

  const campos = [
    { label: 'Nombre completo', value: `${profile.nombre} ${profile.apellidoPaterno} ${profile.apellidoMaterno ?? ''}` },
    { label: 'Boleta', value: profile.boleta },
    { label: 'Carrera', value: profile.carrera },
    { label: 'Plan de estudios', value: profile.plan },
    { label: 'Semestre actual', value: profile.semestre },
    { label: 'Estatus', value: profile.estatus },
  ];

  return (
    <div className="max-w-3xl space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Datos Personales</h2>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-700 mb-4">Información académica</h3>
        <dl className="grid grid-cols-2 gap-3">
          {campos.map(({ label, value }) => (
            <div key={label}>
              <dt className="text-xs text-gray-400 uppercase tracking-wide">{label}</dt>
              <dd className="text-gray-800 font-medium">{String(value)}</dd>
            </div>
          ))}
          <div>
            <dt className="text-xs text-gray-400 uppercase tracking-wide">Correo de contacto</dt>
            <dd className="text-gray-800 font-medium">{profile.correo}</dd>
          </div>
        </dl>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-700 mb-4">Cambiar correo de contacto</h3>
        <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-3">
          <input
            {...emailForm.register('correo')}
            placeholder="nuevo@correo.com"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ipn-guinda"
          />
          {emailForm.formState.errors.correo && (
            <p className="text-red-500 text-xs">{emailForm.formState.errors.correo.message as string}</p>
          )}
          {emailMsg && <p className="text-sm text-green-600">{emailMsg}</p>}
          <button
            type="submit"
            className="bg-ipn-guinda text-white px-4 py-2 rounded-lg text-sm hover:bg-ipn-guinda/90"
          >
            Actualizar correo
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-700 mb-4">Cambiar contraseña</h3>
        <form onSubmit={pwForm.handleSubmit(onPwSubmit)} className="space-y-3">
          <input
            type="password"
            {...pwForm.register('passwordActual')}
            placeholder="Contraseña actual"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ipn-guinda"
          />
          <input
            type="password"
            {...pwForm.register('passwordNueva')}
            placeholder="Nueva contraseña (mín. 8 chars, 1 mayúscula, 1 número)"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ipn-guinda"
          />
          {pwMsg && <p className="text-sm text-green-600">{pwMsg}</p>}
          <button
            type="submit"
            className="bg-ipn-guinda text-white px-4 py-2 rounded-lg text-sm hover:bg-ipn-guinda/90"
          >
            Cambiar contraseña
          </button>
        </form>
      </div>
    </div>
  );
}
