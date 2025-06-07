import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getCurrentUser, sifreSifirla } from '../lib/supabase';
import { useKullanici } from '../baglam/KullaniciBaglami';

const SifreSiflaSayfasi: React.FC = () => {
  const navigate = useNavigate();
  const { kullanici } = useKullanici();
  const [yukleniyor, setYukleniyor] = useState(true);

  const [hataMesaji, setHataMesaji] = useState('');
  const [basariMesaji, setBasariMesaji] = useState('');

  useEffect(() => {
    const kullaniciKontrol = async () => {
      try {
        const mevcutKullanici = await getCurrentUser();
        if (mevcutKullanici) {
          navigate('/');
        }
      } catch (error) {
        console.error('Kullanıcı kontrolü sırasında hata:', error);
        setHataMesaji('Kullanıcı bilgileri kontrol edilirken bir hata oluştu.');
      } finally {
        setYukleniyor(false);
      }
    };

    kullaniciKontrol();
  }, [navigate]);



  if (yukleniyor) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Şifre Sıfırlama
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            E-posta adresinizi girin, şifre sıfırlama bağlantısı gönderelim
          </p>
        </div>

        {/* Hata ve Başarı Mesajları */}
        {hataMesaji && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{hataMesaji}</p>
              </div>
            </div>
          </div>
        )}

        {basariMesaji && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800">{basariMesaji}</p>
              </div>
            </div>
          </div>
        )}

        <SifreSifirlamaFormu 
          onHata={setHataMesaji}
          onBasari={setBasariMesaji}
        />

        <div className="text-center">
          <Link
            to="/giris"
            className="text-sm text-green-600 hover:text-green-500 font-medium"
          >
            ← Giriş sayfasına dön
          </Link>
        </div>
      </div>
    </div>
  );
};

// Şifre Sıfırlama Form Bileşeni
interface SifreSifirlamaFormuProps {
  onHata: (mesaj: string) => void;
  onBasari: (mesaj: string) => void;
}

const SifreSifirlamaFormu: React.FC<SifreSifirlamaFormuProps> = ({ onHata, onBasari }) => {
  const [email, setEmail] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      onHata('E-posta adresi gereklidir.');
      return;
    }

    if (!email.includes('@')) {
      onHata('Geçerli bir e-posta adresi giriniz.');
      return;
    }

    setYukleniyor(true);
    onHata('');
    onBasari('');

    try {
      // Supabase şifre sıfırlama fonksiyonunu çağır
      const { success, message } = await sifreSifirla(email);
      
      if (success) {
        onBasari(message);
        setEmail('');
      } else {
        onHata(message);
      }
    } catch (error: any) {
      const hataMesajlari: { [key: string]: string } = {
        'Invalid email': 'Geçersiz e-posta adresi.',
        'User not found': 'Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı.',
        'Too many requests': 'Çok fazla istek gönderildi. Lütfen daha sonra tekrar deneyin.',
        'Network error': 'İnternet bağlantınızı kontrol edin ve tekrar deneyin.',
      };

      const turkceHata = hataMesajlari[error.message] || 'Şifre sıfırlama işlemi sırasında bir hata oluştu.';
      // Hem İngilizce hem Türkçe hata mesajını göster
      const ciftDilliHata = `${turkceHata} (${error.message})`;
      onHata(ciftDilliHata);
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          E-posta Adresi
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
          placeholder="ornek@email.com"
        />
      </div>

      <div>
        <button
          type="submit"
          disabled={yukleniyor}
          className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {yukleniyor ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Gönderiliyor...
            </>
          ) : (
            'Şifre Sıfırlama Bağlantısı Gönder'
          )}
        </button>
      </div>
    </form>
  );
};

export default SifreSiflaSayfasi;