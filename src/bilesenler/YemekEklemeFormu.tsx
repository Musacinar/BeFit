import React, { useState, useEffect } from 'react';
import { Plus, Save, Search } from 'lucide-react';
import { useYemek } from '../baglam/YemekBaglami';
import { bugunTarih } from '../yardimcilar';
import { Yemek, YemekVeritabani } from '../tipler';
import { supabase } from '../lib/supabase';

interface YemekEklemeFormuProps {
  varsayilanDegerler?: Partial<Yemek>;
  kapatModal?: () => void;
  duzenlemeModu?: boolean;
  yemekId?: string;
}

const YemekEklemeFormu: React.FC<YemekEklemeFormuProps> = ({
  varsayilanDegerler,
  kapatModal,
  duzenlemeModu = false,
  yemekId
}) => {
  const { yemekEkle, yemekGuncelle, hazirYemekler, yemekAra, verileriYenile } = useYemek();
  const [aramaMetni, setAramaMetni] = useState('');
  const [filtrelenmisYemekler, setFiltrelenmisYemekler] = useState<YemekVeritabani[]>([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState('');
  const [seciliHazirYemek, setSeciliHazirYemek] = useState<YemekVeritabani | null>(null);

  const [yemekVerisi, setYemekVerisi] = useState<Partial<Yemek>>({
    ad: '',
    kalori: 0,
    porsiyon: 1,
    birim: 'porsiyon',
    tarih: bugunTarih(),
    ogun: 'Kahvaltı',
    ...varsayilanDegerler
  });

  useEffect(() => {
    if (aramaMetni.length >= 2) {
      try {
        const sonuclar = yemekAra(aramaMetni);
        setFiltrelenmisYemekler(sonuclar);
      } catch (error) {
        console.error('Arama hatası:', error);
        setFiltrelenmisYemekler([]);
      }
    } else {
      setFiltrelenmisYemekler([]);
    }
  }, [aramaMetni, yemekAra]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Hata mesajını temizle
    if (hata) setHata('');

    if (name === 'kalori') {
      const kaloriDegeri = parseFloat(value) || 0;
      setYemekVerisi(prev => ({ ...prev, kalori: kaloriDegeri }));
    } else if (name === 'porsiyon') {
      const yeniPorsiyon = parseFloat(value) || 0;
      const eskiPorsiyon = yemekVerisi.porsiyon || 1;
      
      if (eskiPorsiyon > 0 && yeniPorsiyon > 0) {
        const oran = yeniPorsiyon / eskiPorsiyon;
        setYemekVerisi(prev => ({
          ...prev,
          porsiyon: yeniPorsiyon,
          kalori: Math.round((prev.kalori || 0) * oran),
          protein: prev.protein ? Math.round(prev.protein * oran * 10) / 10 : undefined,
          karbonhidrat: prev.karbonhidrat ? Math.round(prev.karbonhidrat * oran * 10) / 10 : undefined,
          yag: prev.yag ? Math.round(prev.yag * oran * 10) / 10 : undefined
        }));
      } else {
        setYemekVerisi(prev => ({ ...prev, porsiyon: yeniPorsiyon }));
      }
    } else if (name === 'birim') {
      const eskiBirim = yemekVerisi.birim;
      const yeniBirim = value;

      if (eskiBirim === 'gram' && yeniBirim === 'porsiyon') {
        const gramMiktari = yemekVerisi.porsiyon || 0;
        setYemekVerisi(prev => ({ 
          ...prev, 
          birim: yeniBirim, 
          porsiyon: Math.round((gramMiktari / 100) * 10) / 10 
        }));
      } else if (eskiBirim === 'porsiyon' && yeniBirim === 'gram') {
        const porsiyonMiktari = yemekVerisi.porsiyon || 0;
        setYemekVerisi(prev => ({ 
          ...prev, 
          birim: yeniBirim, 
          porsiyon: porsiyonMiktari * 100 
        }));
      } else {
        setYemekVerisi(prev => ({ ...prev, birim: yeniBirim }));
      }
    } else {
      setYemekVerisi(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleYemekSec = (yemek: YemekVeritabani) => {
    setSeciliHazirYemek(yemek);
    const porsiyon = yemekVerisi.porsiyon || 1;
    setYemekVerisi(prev => ({
      ...prev,
      ad: yemek.ad,
      kalori: Math.round(yemek.kalori * porsiyon),
      protein: Math.round(yemek.protein * porsiyon * 10) / 10,
      karbonhidrat: Math.round(yemek.karbonhidrat * porsiyon * 10) / 10,
      yag: Math.round(yemek.yag * porsiyon * 10) / 10,
      birim: yemek.birim
    }));
    setAramaMetni('');
    setFiltrelenmisYemekler([]);
  };

  const formSifirla = () => {
    setYemekVerisi({
      ad: '',
      kalori: 0,
      porsiyon: 1,
      birim: 'porsiyon',
      tarih: bugunTarih(),
      ogun: 'Kahvaltı'
  
    });
    setSeciliHazirYemek(null);
    setAramaMetni('');
    setFiltrelenmisYemekler([]);
    setHata('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setYukleniyor(true);
    setHata('');

    // Validasyon
    if (!yemekVerisi.ad?.trim()) {
      setHata('Lütfen yemek adını girin.');
      setYukleniyor(false);
      return;
    }

    if (!yemekVerisi.kalori || yemekVerisi.kalori <= 0) {
      setHata('Lütfen geçerli bir kalori değeri girin.');
      setYukleniyor(false);
      return;
    }

    if (!yemekVerisi.porsiyon || yemekVerisi.porsiyon <= 0) {
      setHata('Lütfen geçerli bir porsiyon miktarı girin.');
      setYukleniyor(false);
      return;
    }

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      if (!user) {
        throw new Error('Kullanıcı oturumu bulunamadı');
      }

      if (duzenlemeModu && yemekId) {
        // Düzenleme modu - Supabase'de güncelle
        const { error: updateError } = await supabase
          .from('kullanici_yemekleri')
          .update({
            yemek_adi: yemekVerisi.ad, // veritabanındaki sütun adı
            food_id: seciliHazirYemek ? seciliHazirYemek.id : null,
            birim: yemekVerisi.birim,
            porsiyon: yemekVerisi.porsiyon,
            kalori: yemekVerisi.kalori,
            protein: yemekVerisi.protein || 0,
            karbonhidrat: yemekVerisi.karbonhidrat || 0,
            yag: yemekVerisi.yag || 0,
            tarih: yemekVerisi.tarih,
           
            // kategori yerine başka bir alan kullanıyorsanız burayı değiştirin
          })
          .eq('id', yemekId)
          .eq('user_id', user.id);

        if (updateError) throw updateError;

        // Local state'i güncelle
        await yemekGuncelle(yemekId, yemekVerisi);
        
        console.log('✅ Yemek başarıyla güncellendi!');
      } else {
        // Yeni ekleme modu - Supabase'e kaydet
        const foodId = seciliHazirYemek ? seciliHazirYemek.id : null;

        const { data: insertData, error: insertError } = await supabase
          .from('kullanici_yemekleri')
          .insert([
            {
              user_id: user.id,
              yemek_adi: yemekVerisi.ad, // veritabanındaki sütun adı
              food_id: foodId,
              birim: yemekVerisi.birim,
              porsiyon: yemekVerisi.porsiyon,
              kalori: yemekVerisi.kalori,
              protein: yemekVerisi.protein || 0,
              karbonhidrat: yemekVerisi.karbonhidrat || 0,
              yag: yemekVerisi.yag || 0,
              tarih: yemekVerisi.tarih, // tarih sütunu var
              // created_at otomatik olarak ayarlanacak
            }
          ])
          .select(); // Eklenen veriyi geri al

        if (insertError) {
          console.error('Supabase insert hatası:', insertError);
          throw insertError;
        }

        console.log('✅ Yemek başarıyla Supabase\'e kaydedildi:', insertData);

        // Local state'e ekle
        await yemekEkle(yemekVerisi as Omit<Yemek, 'id'>);
      }

      // Verileri yenile
      await verileriYenile();

      // Başarılı işlem sonrası
      if (kapatModal) {
        kapatModal();
      } else {
        formSifirla();
      }

    } catch (err: any) {
      console.error('Yemek kaydedilirken hata:', err);
      setHata(err.message || 'Yemek kaydedilirken bir hata oluştu.');
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-6 shadow-lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          {hata && (
            <div className="flex items-center p-4 bg-red-50 border-l-4 border-red-400 rounded-md">
              <div className="text-red-700 text-sm">{hata}</div>
            </div>
          )}
          
          {yukleniyor && (
            <div className="flex items-center p-4 bg-blue-50 border-l-4 border-blue-400 rounded-md">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-3"></div>
              <div className="text-blue-700 text-sm">
                {duzenlemeModu ? 'Güncelleniyor...' : 'Yemek kaydediliyor...'}
              </div>
            </div>
          )}
  

          <div className="grid grid-cols-1 gap-4">

            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🔍 Hazır Yemek Ara
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={aramaMetni}
                  onChange={(e) => setAramaMetni(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white/70 backdrop-blur-sm"
                  placeholder="Örn: tavuk göğsü, elma..."
                />
                <Search className="absolute right-4 top-3.5 h-5 w-5 text-gray-400" />
              </div>
              
              {filtrelenmisYemekler.length > 0 && (
                <div className="absolute z-50 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl mt-2 w-full max-h-60 overflow-auto shadow-xl">
                  {filtrelenmisYemekler.map((yemek) => (
                    <button
                      key={yemek.id}
                      type="button"
                      onClick={() => handleYemekSec(yemek)}
                      className="w-full px-4 py-3 text-left hover:bg-green-50 border-b border-gray-100 last:border-b-0 transition-colors"
                    >
                      <div className="font-medium text-gray-900">{yemek.ad}</div>
                      <div className="text-sm text-gray-500 flex items-center space-x-4">
                        <span>🔥 {yemek.kalori} kcal</span>
                        <span>🥩 {yemek.protein}g protein</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
  
   
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🍽️ Yemek Adı *
              </label>
              <input
                type="text"
                name="ad"
                value={yemekVerisi.ad}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white/70 backdrop-blur-sm"
                placeholder="Yemek adını girin"
                required
              />
            </div>
          </div>
  

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🔥 Kalori *
              </label>
              <input
                type="number"
                name="kalori"
                value={yemekVerisi.kalori || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-white/70 backdrop-blur-sm"
                min="0"
                step="1"
                placeholder="0"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ⚖️ Miktar *
              </label>
              <input
                type="number"
                name="porsiyon"
                value={yemekVerisi.porsiyon || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/70 backdrop-blur-sm"
                step="0.1"
                min="0"
                placeholder="1"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📏 Birim
              </label>
              <select
                name="birim"
                value={yemekVerisi.birim}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white/70 backdrop-blur-sm"
              >
                <option value="porsiyon">Porsiyon</option>
                <option value="gram">Gram</option>
                <option value="adet">Adet</option>
                <option value="kase">Kase</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📅 Tarih
              </label>
              <input
                type="date"
                name="tarih"
                value={yemekVerisi.tarih}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white/70 backdrop-blur-sm"
              />
            </div>
  
            <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
                🕐 Öğün
              </label>
              <select
                name="ogun"
                value={yemekVerisi.ogun}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white/70 backdrop-blur-sm"
              >
                <option value="Kahvaltı">🌅 Kahvaltı</option>
                <option value="Öğle Yemeği">☀️ Öğle Yemeği</option>
                <option value="Akşam Yemeği">🌙 Akşam Yemeği</option>
                <option value="Ara Öğün">🍎 Ara Öğün</option>
              </select>
            </div>
          </div>
  

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">🥗 Besin Değerleri (Opsiyonel)</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">🥩 Protein (g)</label>
                <input
                  type="number"
                  name="protein"
                  value={yemekVerisi.protein || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all bg-white/70 backdrop-blur-sm text-sm"
                  step="0.1"
                  min="0"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">🍞 Karb. (g)</label>
                <input
                  type="number"
                  name="karbonhidrat"
                  value={yemekVerisi.karbonhidrat || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all bg-white/70 backdrop-blur-sm text-sm"
                  step="0.1"
                  min="0"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">🧈 Yağ (g)</label>
                <input
                  type="number"
                  name="yag"
                  value={yemekVerisi.yag || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all bg-white/70 backdrop-blur-sm text-sm"
                  step="0.1"
                  min="0"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
  

          <button
            type="submit"
            disabled={yukleniyor}
            className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 disabled:from-gray-400 disabled:to-gray-400 text-white px-6 py-4 rounded-xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02) shadow-lg font-semibold text-lg"
          >
            <Save className="h-6 w-6" />
            {yukleniyor ? 
              (duzenlemeModu ? 'Güncelleniyor...' : 'Kaydediliyor...') : 
              (duzenlemeModu ? '✨ Güncelle' : '✨ Ekle')
            }
          </button>
        </form>
      </div>
    </div>
  );
};

export default YemekEklemeFormu;