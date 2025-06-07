  /*import React, { useState, useEffect } from 'react';
  import { useKullanici } from '../baglam/KullaniciBaglami';
  import { supabase } from '../lib/supabase';
  import { Dumbbell, Clock, Heart, Award, ChevronDown, ChevronUp } from 'lucide-react';
  import { motion } from 'framer-motion';

  interface Egzersiz {
    id: number;
    ad: string;
    aciklama: string;
    set: number;
    tekrar: number;
    kategori: string;
    vki_kategori: string;
    resim_url?: string;
  }

  const SporProgramiSayfasi: React.FC = () => {
    const { kullanici, vucutKitleIndeksi } = useKullanici();
    const [egzersizler, setEgzersizler] = useState<Egzersiz[]>([]);
    const [yukleniyor, setYukleniyor] = useState(true);
    const [hata, setHata] = useState('');
    const [acikEgzersiz, setAcikEgzersiz] = useState<number | null>(null);
    const [filtreKategori, setFiltreKategori] = useState<string>('Tümü');
    
    const vki = vucutKitleIndeksi();
    const vkiKategori = vki < 18.5 ? 'zayif' : vki < 25 ? 'normal' : vki < 30 ? 'kilolu' : 'obez';
    
    useEffect(() => {
      const fetchEgzersizler = async () => {
        setYukleniyor(true);
        try {
          // Kullanıcının VKİ değerini veritabanına kaydet
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase
              .from('profiles')
              .update({ vki: vki, vki_kategori: vkiKategori })
              .eq('user_id', user.id);
          }
          
          // Egzersizleri getir
          let query = supabase.from('egzersizler').select('*');
          
          // VKİ kategorisine göre filtrele
          query = query.or(`vki_kategori.eq.${vkiKategori},vki_kategori.eq.tum`);
          
          const { data, error } = await query;
          
          if (error) throw error;
          
          if (data) {
            setEgzersizler(data);
          }
        } catch (error) {
          console.error('Egzersizler yüklenirken hata:', error);
          setHata('Egzersizler yüklenirken bir hata oluştu.');
        } finally {
          setYukleniyor(false);
        }
      };
      
      fetchEgzersizler();
    }, [vki, vkiKategori]);
    
    const kategoriler = ['Tümü', ...new Set(egzersizler.map(e => e.kategori))];
    
    const filtrelenmisEgzersizler = filtreKategori === 'Tümü' 
      ? egzersizler 
      : egzersizler.filter(e => e.kategori === filtreKategori);
    
    const toggleEgzersiz = (id: number) => {
      setAcikEgzersiz(acikEgzersiz === id ? null : id);
    };
    
    const vkiDurumBilgisi = () => {
      if (vki < 18.5) return {
        durum: 'Zayıf',
        renk: 'bg-blue-100 text-blue-800',
        aciklama: 'Kas kütlenizi artırmaya odaklanan egzersizler önerilir.'
      };
      if (vki < 25) return {
        durum: 'Normal',
        renk: 'bg-green-100 text-green-800',
        aciklama: 'Genel fitness ve sağlığı korumaya yönelik dengeli egzersizler önerilir.'
      };
      if (vki < 30) return {
        durum: 'Fazla Kilolu',
        renk: 'bg-yellow-100 text-yellow-800',
        aciklama: 'Kalori yakımını artıran kardiyovasküler egzersizler ve kuvvet antrenmanları önerilir.'
      };
      return {
        durum: 'Obez',
        renk: 'bg-red-100 text-red-800',
        aciklama: 'Eklemlere yük bindirmeyen düşük etkili kardiyovasküler egzersizler ve kademeli kuvvet antrenmanları önerilir.'
      };
    };
    
    const { durum, renk, aciklama } = vkiDurumBilgisi();
    
    if (yukleniyor) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Kişiselleştirilmiş Spor Programı</h1>
        

        <div className={`p-4 rounded-lg ${renk} mb-6`}>
          <div className="flex items-center">
            <div className="rounded-full p-2 bg-white mr-3">
              <Award className="h-6 w-6 text-gray-700" />
            </div>
            <div>
              <h2 className="font-semibold">VKİ Durumunuz: {durum} ({vki.toFixed(1)})</h2>
              <p>{aciklama}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {kategoriler.map(kategori => (
            <button
              key={kategori}
              onClick={() => setFiltreKategori(kategori)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filtreKategori === kategori ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {kategori}
            </button>
          ))}
        </div>
        
        {hata ? (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg">{hata}</div>
        ) : filtrelenmisEgzersizler.length === 0 ? (
          <div className="bg-gray-100 p-8 rounded-lg text-center">
            <p className="text-gray-600">Bu kategoride egzersiz bulunamadı.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtrelenmisEgzersizler.map((egzersiz) => (
              <motion.div 
                key={egzersiz.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <div 
                  className="p-4 cursor-pointer flex justify-between items-center"
                  onClick={() => toggleEgzersiz(egzersiz.id)}
                >
                  <div className="flex items-center">
                    <div className="rounded-full bg-green-100 p-2 mr-3">
                      <Dumbbell className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{egzersiz.ad}</h3>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{egzersiz.set} set × {egzersiz.tekrar} tekrar</span>
                      </div>
                    </div>
                  </div>
                  {acikEgzersiz === egzersiz.id ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </div>
                
                {acikEgzersiz === egzersiz.id && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="px-4 pb-4"
                  >
                    <div className="border-t border-gray-100 pt-3 mt-2">
                      <p className="text-gray-600 mb-3">{egzersiz.aciklama}</p>
                      
                      {egzersiz.resim_url && (
                        <img 
                          src={egzersiz.resim_url} 
                          alt={egzersiz.ad} 
                          className="w-full h-48 object-cover rounded-md mb-3"
                        />
                      )}
                      
                      <div className="bg-gray-50 p-3 rounded-md">
                        <h4 className="font-medium text-gray-700 mb-2">Nasıl Yapılır:</h4>
                        <ol className="list-decimal list-inside space-y-1 text-gray-600">
                          <li>Doğru duruşla başlayın ve nefes kontrolüne dikkat edin.</li>
                          <li>Hareketi kontrollü ve yavaş bir şekilde gerçekleştirin.</li>
                          <li>{egzersiz.set} set boyunca her sette {egzersiz.tekrar} tekrar yapın.</li>
                          <li>Setler arasında 60-90 saniye dinlenin.</li>
                        </ol>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-md p-6 mt-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Heart className="h-5 w-5 text-red-500 mr-2" />
            Haftalık Program Önerisi
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-700 mb-2">Pazartesi & Perşembe</h3>
              <p className="text-gray-600 text-sm mb-2">Üst Vücut Antrenmanı</p>
              <ul className="text-sm text-gray-600 space-y-1">
                {filtrelenmisEgzersizler
                  .filter(e => e.kategori === 'Üst Vücut' || e.kategori === 'Göğüs' || e.kategori === 'Sırt')
                  .slice(0, 4)
                  .map(e => (
                    <li key={e.id} className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      {e.ad}
                    </li>
                  ))}
              </ul>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-700 mb-2">Salı & Cuma</h3>
              <p className="text-gray-600 text-sm mb-2">Alt Vücut Antrenmanı</p>
              <ul className="text-sm text-gray-600 space-y-1">
                {filtrelenmisEgzersizler
                  .filter(e => e.kategori === 'Alt Vücut' || e.kategori === 'Bacak')
                  .slice(0, 4)
                  .map(e => (
                    <li key={e.id} className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      {e.ad}
                    </li>
                  ))}
              </ul>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-700 mb-2">Çarşamba & Cumartesi</h3>
              <p className="text-gray-600 text-sm mb-2">Kardiyo & Esneklik</p>
              <ul className="text-sm text-gray-600 space-y-1">
                {filtrelenmisEgzersizler
                  .filter(e => e.kategori === 'Kardiyo' || e.kategori === 'Esneklik')
                  .slice(0, 4)
                  .map(e => (
                    <li key={e.id} className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      {e.ad}
                    </li>
                  ))}
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  30 dakika tempolu yürüyüş
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Not:</strong> Bu program sizin VKİ değerinize ({vki.toFixed(1)}) göre özelleştirilmiştir. 
              Egzersizlere başlamadan önce ısınma hareketleri yapmayı ve her antrenman sonrası soğuma egzersizleri 
              yapmayı unutmayın. Herhangi bir sağlık sorununuz varsa, egzersiz programına başlamadan önce 
              doktorunuza danışmanız önerilir.
            </p>
          </div>
        </div>
      </div>
    );
  };

  export default SporProgramiSayfasi;*/

  import React, { useState, useEffect } from 'react';
import { useKullanici } from '../baglam/KullaniciBaglami';
import { supabase } from '../lib/supabase';
import { Dumbbell, Clock, Heart, Award, ChevronDown, ChevronUp, Play } from 'lucide-react';
import { motion } from 'framer-motion';

interface Egzersiz {
  id: number;
  ad: string;
  aciklama: string;
  set: number;
  tekrar: number;
  kategori: string;
  vki_kategori: string;
  video_url?: string; // Resim yerine video URL
}

const SporProgramiSayfasi: React.FC = () => {
  const { kullanici, vucutKitleIndeksi } = useKullanici();
  const [egzersizler, setEgzersizler] = useState<Egzersiz[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');
  const [acikEgzersiz, setAcikEgzersiz] = useState<number | null>(null);
  const [filtreKategori, setFiltreKategori] = useState<string>('Tümü');
  
  const vki = vucutKitleIndeksi();
  const vkiKategori = vki < 18.5 ? 'zayif' : vki < 25 ? 'normal' : vki < 30 ? 'kilolu' : 'obez';
  
  useEffect(() => {
    const fetchEgzersizler = async () => {
      setYukleniyor(true);
      try {
        // Kullanıcının VKİ değerini veritabanına kaydet
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('profiles')
            .update({ vki: vki, vki_kategori: vkiKategori })
            .eq('user_id', user.id);
        }
        
        // Egzersizleri getir - video_url dahil
        let query = supabase.from('egzersizler').select('id, ad, aciklama, set, tekrar, kategori, vki_kategori, video_url');
        
        // VKİ kategorisine göre filtrele
        query = query.or(`vki_kategori.eq.${vkiKategori},vki_kategori.eq.tum`);
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        if (data) {
          setEgzersizler(data);
        }
      } catch (error) {
        console.error('Egzersizler yüklenirken hata:', error);
        setHata('Egzersizler yüklenirken bir hata oluştu.');
      } finally {
        setYukleniyor(false);
      }
    };
    
    fetchEgzersizler();
  }, [vki, vkiKategori]);
  
  const kategoriler = ['Tümü', ...new Set(egzersizler.map(e => e.kategori))];
  
  const filtrelenmisEgzersizler = filtreKategori === 'Tümü' 
    ? egzersizler 
    : egzersizler.filter(e => e.kategori === filtreKategori);
  
  const toggleEgzersiz = (id: number) => {
    setAcikEgzersiz(acikEgzersiz === id ? null : id);
  };
  
  const vkiDurumBilgisi = () => {
    if (vki < 18.5) return {
      durum: 'Zayıf',
      renk: 'bg-blue-100 text-blue-800',
      aciklama: 'Kas kütlenizi artırmaya odaklanan egzersizler önerilir.'
    };
    if (vki < 25) return {
      durum: 'Normal',
      renk: 'bg-green-100 text-green-800',
      aciklama: 'Genel fitness ve sağlığı korumaya yönelik dengeli egzersizler önerilir.'
    };
    if (vki < 30) return {
      durum: 'Fazla Kilolu',
      renk: 'bg-yellow-100 text-yellow-800',
      aciklama: 'Kalori yakımını artıran kardiyovasküler egzersizler ve kuvvet antrenmanları önerilir.'
    };
    return {
      durum: 'Obez',
      renk: 'bg-red-100 text-red-800',
      aciklama: 'Eklemlere yük bindirmeyen düşük etkili kardiyovasküler egzersizler ve kademeli kuvvet antrenmanları önerilir.'
    };
  };
  
  const { durum, renk, aciklama } = vkiDurumBilgisi();
  
  if (yukleniyor) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Kişiselleştirilmiş Spor Programı</h1>
      
      {/* VKİ Bilgisi */}
      <div className={`p-4 rounded-lg ${renk} mb-6`}>
        <div className="flex items-center">
          <div className="rounded-full p-2 bg-white mr-3">
            <Award className="h-6 w-6 text-gray-700" />
          </div>
          <div>
            <h2 className="font-semibold">VKİ Durumunuz: {durum} ({vki.toFixed(1)})</h2>
            <p>{aciklama}</p>
          </div>
        </div>
      </div>
      
      {/* Kategori Filtreleme */}
      <div className="flex flex-wrap gap-2 mb-6">
        {kategoriler.map(kategori => (
          <button
            key={kategori}
            onClick={() => setFiltreKategori(kategori)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filtreKategori === kategori ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {kategori}
          </button>
        ))}
      </div>
      
      {/* Egzersiz Listesi */}
      {hata ? (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg">{hata}</div>
      ) : filtrelenmisEgzersizler.length === 0 ? (
        <div className="bg-gray-100 p-8 rounded-lg text-center">
          <p className="text-gray-600">Bu kategoride egzersiz bulunamadı.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtrelenmisEgzersizler.map((egzersiz) => (
            <motion.div 
              key={egzersiz.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div 
                className="p-4 cursor-pointer flex justify-between items-center"
                onClick={() => toggleEgzersiz(egzersiz.id)}
              >
                <div className="flex items-center">
                  <div className="rounded-full bg-green-100 p-2 mr-3">
                    <Dumbbell className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{egzersiz.ad}</h3>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{egzersiz.set} set × {egzersiz.tekrar} tekrar</span>
                      {egzersiz.video_url && (
                        <span className="ml-3 flex items-center text-red-500">
                          <Play className="h-3 w-3 mr-1" />
                          Video
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {acikEgzersiz === egzersiz.id ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </div>
              
              {acikEgzersiz === egzersiz.id && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="px-4 pb-4"
                >
                  <div className="border-t border-gray-100 pt-3 mt-2">
                    <p className="text-gray-600 mb-4">{egzersiz.aciklama}</p>
                    
                    {/* Video Link Butonu */}
                    {egzersiz.video_url && (
                      <div className="mb-4">
                        <a
                          href={egzersiz.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors shadow-sm"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Hareket Videosunu İzle
                        </a>
                      </div>
                    )}
                    
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                        <Award className="h-4 w-4 mr-2 text-green-500" />
                        Nasıl Yapılır:
                      </h4>
                      <ol className="list-decimal list-inside space-y-2 text-gray-600">
                        <li>Doğru duruşla başlayın ve nefes kontrolüne dikkat edin.</li>
                        <li>Hareketi kontrollü ve yavaş bir şekilde gerçekleştirin.</li>
                        <li><strong>{egzersiz.set} set</strong> boyunca her sette <strong>{egzersiz.tekrar} tekrar</strong> yapın.</li>
                        <li>Setler arasında <strong>60-90 saniye</strong> dinlenin.</li>
                      </ol>
                      
                      {egzersiz.video_url && (
                        <div className="mt-3 p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                          <p className="text-sm text-blue-700">
                            💡 <strong>İpucu:</strong> Hareketi doğru yapmak için yukarıdaki video linkini izleyerek tekniği öğrenin.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}
      
      {/* Haftalık Program Önerisi */}
      <div className="bg-white rounded-lg shadow-md p-6 mt-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <Heart className="h-5 w-5 text-red-500 mr-2" />
          Haftalık Program Önerisi
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-700 mb-2">Pazartesi & Perşembe</h3>
            <p className="text-gray-600 text-sm mb-2">Üst Vücut Antrenmanı</p>
            <ul className="text-sm text-gray-600 space-y-1">
              {filtrelenmisEgzersizler
                .filter(e => e.kategori === 'Üst Vücut' || e.kategori === 'Göğüs' || e.kategori === 'Sırt')
                .slice(0, 4)
                .map(e => (
                  <li key={e.id} className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    {e.ad}
                    {e.video_url && <Play className="h-3 w-3 ml-1 text-red-400" />}
                  </li>
                ))}
            </ul>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-700 mb-2">Salı & Cuma</h3>
            <p className="text-gray-600 text-sm mb-2">Alt Vücut Antrenmanı</p>
            <ul className="text-sm text-gray-600 space-y-1">
              {filtrelenmisEgzersizler
                .filter(e => e.kategori === 'Alt Vücut' || e.kategori === 'Bacak')
                .slice(0, 4)
                .map(e => (
                  <li key={e.id} className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    {e.ad}
                    {e.video_url && <Play className="h-3 w-3 ml-1 text-red-400" />}
                  </li>
                ))}
            </ul>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-700 mb-2">Çarşamba & Cumartesi</h3>
            <p className="text-gray-600 text-sm mb-2">Kardiyo & Esneklik</p>
            <ul className="text-sm text-gray-600 space-y-1">
              {filtrelenmisEgzersizler
                .filter(e => e.kategori === 'Kardiyo' || e.kategori === 'Esneklik')
                .slice(0, 4)
                .map(e => (
                  <li key={e.id} className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    {e.ad}
                    {e.video_url && <Play className="h-3 w-3 ml-1 text-red-400" />}
                  </li>
                ))}
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                30 dakika tempolu yürüyüş
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Not:</strong> Bu program sizin VKİ değerinize ({vki.toFixed(1)}) göre özelleştirilmiştir. 
            Egzersizlere başlamadan önce ısınma hareketleri yapmayı ve her antrenman sonrası soğuma egzersizleri 
            yapmayı unutmayın. Video linklerini izleyerek hareketleri doğru yapmaya özen gösterin. 
            Herhangi bir sağlık sorununuz varsa, egzersiz programına başlamadan önce doktorunuza danışmanız önerilir.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SporProgramiSayfasi;