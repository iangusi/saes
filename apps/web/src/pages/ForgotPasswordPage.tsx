import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { useState } from 'react';

const schema = z.object({ correo: z.string().email('Correo inválido') });
type FormData = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    await authService.forgotPassword(data.correo);
    setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        <h1 className="text-xl font-bold text-ipn-guinda mb-4">Recuperar contraseña</h1>

        {sent ? (
          <div className="text-green-700 bg-green-50 border border-green-200 rounded-lg p-4 text-sm">
            Si tu correo está registrado, recibirás un enlace para restablecer tu contraseña.
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo electrónico
              </label>
              <input
                {...register('correo')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ipn-guinda"
              />
              {errors.correo && (
                <p className="text-red-500 text-xs mt-1">{errors.correo.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-ipn-guinda text-white font-semibold py-2 rounded-lg hover:bg-ipn-guinda/90 disabled:opacity-50"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar enlace'}
            </button>
          </form>
        )}

        <div className="mt-4 text-center">
          <Link to="/login" className="text-sm text-ipn-guinda hover:underline">
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
