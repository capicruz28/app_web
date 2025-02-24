// src/pages/auth/Login.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/auth.service';
import Cookies from 'js-cookie';

const Login = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authService.login(formData);
      setAuth({
        user: response.user,
        token: response.access_token,
      });
      Cookies.set('token', response.access_token);
      toast.success('Inicio de sesión exitoso');
      navigate('/');
    } catch (error) {
      toast.error('Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <img 
            src="/login-illustration.svg" 
            alt="Login" 
            className="h-48 w-auto mx-auto"
          />
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            Iniciar Sesión
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Ingresa tus credenciales para continuar
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Usuario
              </label>
              <input
                type="text"
                required
                className="input mt-1 w-full"
                placeholder="Ingresa tu usuario"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  username: e.target.value
                }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Contraseña
              </label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="input w-full pr-10"
                  placeholder="Ingresa tu contraseña"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    password: e.target.value
                  }))}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <a href="#" className="font-medium text-primary hover:text-primary/80">
                ¿Olvidaste tu contraseña?
              </a>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">
                o
              </span>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-secondary w-full flex items-center justify-center"
          >
            <img
              className="h-5 w-5 mr-2"
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
            />
            Continuar con Google
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;