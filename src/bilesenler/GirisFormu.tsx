import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signIn, signUp } from '../lib/supabase';

interface GirisFormuProps {
  kapatModal?: () => void;
}

const GirisFormu: React.FC<GirisFormuProps> = ({ kapatModal }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        // Şifre doğrulama kontrolü
        if (password !== passwordConfirm) {
          setError('Şifreler eşleşmiyor. Lütfen kontrol ediniz.');
          return;
        }
        
        // Şifre uzunluk kontrolü
        if (password.length < 6) {
          setError('Şifre en az 6 karakter uzunluğunda olmalıdır.');
          return;
        }
        
        const { error } = await signUp(email, password);
        if (error) throw error;
        alert('Kayıt başarılı');
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
        if (kapatModal) {
          kapatModal();
        } else {
          navigate('/');
          window.location.reload(); // Sayfayı yenile ve kullanıcı durumunu güncelle
        }
      }
    } catch (err: any) {
      // Hata mesajlarını Türkçeleştir
      const hataMesajlari: { [key: string]: string } = {
        'Invalid login credentials': 'Geçersiz giriş bilgileri. E-posta veya şifre hatalı.',
        'Email not confirmed': 'E-posta adresi onaylanmamış.',
        'Invalid email': 'Geçersiz e-posta adresi.',
        'User already registered': 'Bu e-posta adresi ile kayıtlı bir kullanıcı zaten var.',
        'Password should be at least 6 characters': 'Şifre en az 6 karakter uzunluğunda olmalıdır.',
        'Network error': 'İnternet bağlantınızı kontrol edin ve tekrar deneyin.'
      };
      
      const turkceHata = hataMesajlari[err.message] || 'Bir hata oluştu. Lütfen tekrar deneyin.';
      // Hem Türkçe hem İngilizce hata mesajını göster
      setError(`${turkceHata} (${err.message})`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            E-posta
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Şifre
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50"
            required
          />
        </div>
        
        {isSignUp && (
          <div>
            <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700">
              Şifre Tekrar
            </label>
            <input
              type="password"
              id="passwordConfirm"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50"
              required
            />
          </div>
        )}

        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          {loading ? 'İşleniyor...' : (isSignUp ? 'Kayıt Ol' : 'Giriş Yap')}
        </button>

        <div className="text-center space-y-2">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-green-600 hover:text-green-500"
          >
            {isSignUp ? 'Zaten hesabınız var mı? Giriş yapın' : 'Hesabınız yok mu? Kayıt olun'}
          </button>
          
          {!isSignUp && (
            <div className="pt-2">
              <Link to="/sifre-sifirla" className="text-sm text-green-600 hover:text-green-500">
                Şifremi unuttum
              </Link>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default GirisFormu;
