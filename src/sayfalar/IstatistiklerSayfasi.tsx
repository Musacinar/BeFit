/*import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { CalendarDays, Loader2 } from 'lucide-react';
import { useYemek } from '../baglam/YemekBaglami';
import { useKullanici } from '../baglam/KullaniciBaglami';
import BesinGrafigi from '../bilesenler/BesinGrafigi';
import { tarihFormati } from '../yardimcilar';
import { supabase } from '../lib/supabase';

const IstatistiklerSayfasi: React.FC = () => {
  const { yemekler, gunlukOzet } = useYemek();
  const { kullanici } = useKullanici();
  
  const [tarihAraligi, setTarihAraligi] = useState<'hafta' | 'ay'>('hafta');
  const [yukleniyor, setYukleniyor] = useState(true);
  const [kullaniciYemekleri, setKullaniciYemekleri] = useState<any[]>([]);
  
  // Son 7 veya 30 günün tarihlerini oluştur
  const tarihlerOlustur = () => {
    const tarihler: string[] = [];
    const gun = 24 * 60 * 60 * 1000; // 1 gün (ms)
    const bugun = new Date();
    bugun.setHours(0, 0, 0, 0);
    
    const gunSayisi = tarihAraligi === 'hafta' ? 7 : 30;
    
    for (let i = gunSayisi - 1; i >= 0; i--) {
      const tarih = new Date(bugun.getTime() - (i * gun));
      tarihler.push(tarih.toISOString().split('T')[0]);
    }
    
    return tarihler;
  };
  
  const [gunlukOzetler, setGunlukOzetler] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchKullaniciYemekleri = async () => {
      setYukleniyor(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        // Kullanıcının yemek kayıtlarını getir - tarih sütunundan çek
        const { data, error } = await supabase
        .from('kullanici_yemekleri')
          .select('*, yemekler(*)')
          .eq('user_id', user.id)
          .order('tarih', { ascending: false });
          
        if (error) throw error;
        
        if (data) {
          setKullaniciYemekleri(data);
        }
      } catch (err) {
        console.error('Yemek verileri alınırken hata:', err);
      } finally {
        setYukleniyor(false);
      }
    };
    
    fetchKullaniciYemekleri();
  }, []);
  
  useEffect(() => {
    const tarihler = tarihlerOlustur();
    const ozetler = tarihler.map(tarih => {
      const ozet = gunlukOzet(tarih);
      
      // Veritabanından gelen yemekleri de dahil et
      const tarihYemekleri = kullaniciYemekleri.filter(y => y.date === tarih);
      const dbKalori = tarihYemekleri.reduce((toplam, y) => toplam + y.calories, 0);
      
      
      return {
        ...ozet,
        tarihFormati: tarihFormati(tarih).split(' ')[0], // Sadece gün ve ay
        toplamKalori: ozet.toplamKalori + dbKalori,
        hedefYuzdesi: Math.min(Math.round(((ozet.toplamKalori + dbKalori) / kullanici.hedefKalori) * 100), 100)
      };
    });
    
    setGunlukOzetler(ozetler);
  }, [tarihAraligi, yemekler, kullanici.hedefKalori, kullaniciYemekleri]);
  
  // Son 7 günün ortalaması
  const ortalamalar = {
    kalori: Math.round(gunlukOzetler.reduce((t, g) => t + g.toplamKalori, 0) / gunlukOzetler.length),
    protein: Math.round(gunlukOzetler.reduce((t, g) => t + g.toplamProtein, 0) / gunlukOzetler.length),
    karbonhidrat: Math.round(gunlukOzetler.reduce((t, g) => t + g.toplamKarbonhidrat, 0) / gunlukOzetler.length),
    yag: Math.round(gunlukOzetler.reduce((t, g) => t + g.toplamYag, 0) / gunlukOzetler.length)
  };
  
  const bugunOzet = gunlukOzet();
  
  if (yukleniyor) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-green-500 animate-spin mb-4" />
        <p className="text-gray-600">İstatistikler yükleniyor...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">İstatistikler</h1>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-5">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800">
              Kalori Alımı
            </h2>
            <div className="flex">
              <button
                onClick={() => setTarihAraligi('hafta')}
                className={`px-3 py-1 rounded-l-md text-sm ${
                  tarihAraligi === 'hafta'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Haftalık
              </button>
              <button
                onClick={() => setTarihAraligi('ay')}
                className={`px-3 py-1 rounded-r-md text-sm ${
                  tarihAraligi === 'ay'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Aylık
              </button>
            </div>
          </div>
          
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={gunlukOzetler}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="tarihFormati" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [`${value} kcal`, 'Kalori']}
                  labelFormatter={(label) => `Tarih: ${label}`}
                />
                <Bar dataKey="toplamKalori" name="Kalori" fill="#22c55e" />
            
                <Line 
                  type="monotone" 
                  dataKey={() => kullanici.hedefKalori} 
                  stroke="#ef4444" 
                  strokeDasharray="5 5" 
                  name="Hedef"
                  dot={false}
                  activeDot={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Bugünkü Besin Dağılımı
              </h2>
              <div className="flex items-center text-sm text-gray-600">
                <CalendarDays className="h-4 w-4 mr-1" />
                <span>{tarihFormati(new Date().toISOString())}</span>
              </div>
            </div>
            
            <BesinGrafigi
              protein={bugunOzet.toplamProtein}
              karbonhidrat={bugunOzet.toplamKarbonhidrat}
              yag={bugunOzet.toplamYag}
            />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {tarihAraligi === 'hafta' ? 'Haftalık' : 'Aylık'} Ortalamalar
            </h2>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Kalori</span>
                  <span className="text-sm font-medium text-gray-700">
                    {ortalamalar.kalori} / {kullanici.hedefKalori} kcal
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-green-600 h-2.5 rounded-full"
                    style={{ width: `${Math.min((ortalamalar.kalori / kullanici.hedefKalori) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Protein</span>
                  <span className="text-sm font-medium text-gray-700">
                    {ortalamalar.protein} / {kullanici.hedefProtein} g
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-500 h-2.5 rounded-full"
                    style={{ width: `${Math.min((ortalamalar.protein / kullanici.hedefProtein) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Karbonhidrat</span>
                  <span className="text-sm font-medium text-gray-700">
                    {ortalamalar.karbonhidrat} / {kullanici.hedefKarbonhidrat} g
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-yellow-500 h-2.5 rounded-full"
                    style={{ width: `${Math.min((ortalamalar.karbonhidrat / kullanici.hedefKarbonhidrat) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Yağ</span>
                  <span className="text-sm font-medium text-gray-700">
                    {ortalamalar.yag} / {kullanici.hedefYag} g
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-red-500 h-2.5 rounded-full"
                    style={{ width: `${Math.min((ortalamalar.yag / kullanici.hedefYag) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-5">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Besin Değerleri Trendi
        </h2>
        
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={gunlukOzetler}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="tarihFormati" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="toplamProtein" 
                name="Protein (g)" 
                stroke="#3b82f6" 
                activeDot={{ r: 6 }} 
              />
              <Line 
                type="monotone" 
                dataKey="toplamKarbonhidrat" 
                name="Karbonhidrat (g)" 
                stroke="#eab308" 
                activeDot={{ r: 6 }} 
              />
              <Line 
                type="monotone" 
                dataKey="toplamYag" 
                name="Yağ (g)" 
                stroke="#ef4444" 
                activeDot={{ r: 6 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default IstatistiklerSayfasi;*/
//------------------------------------------------------
/*
import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { supabase } from '../lib/supabase';
import dayjs from 'dayjs';

const IstatistikSayfasi: React.FC = () => {
  const [yukleniyor, setYukleniyor] = useState(true);
  const [gunlukKalori, setGunlukKalori] = useState<{ tarih: string; kalori: number }[]>([]);

  useEffect(() => {
    const veriGetir = async () => {
      setYukleniyor(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setYukleniyor(false);
          return;
        }

        const { data, error } = await supabase
          .from('kullanici_yemekleri')
          .select('created_at, kalori')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Veri alma hatası:', error);
          setYukleniyor(false);
          return;
        }

        const ozet = data!.reduce((acc: { tarih: string; kalori: number }[], item) => {
          const tarih = dayjs(item.created_at).format('DD.MM.YYYY');
          const mevcut = acc.find(v => v.tarih === tarih);
          if (mevcut) {
            mevcut.kalori += item.kalori;
          } else {
            acc.push({ tarih, kalori: item.kalori });
          }
          return acc;
        }, []);

        setGunlukKalori(ozet);
      } catch (err) {
        console.error('Beklenmeyen hata:', err);
      } finally {
        setYukleniyor(false);
      }
    };

    veriGetir();
  }, []);

  if (yukleniyor) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold mb-4">İstatistikler</h1>


      <div className="bg-white rounded shadow p-4">
        <h2 className="text-lg font-semibold mb-3">Günlük Kalori Alımı</h2>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={gunlukKalori}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="tarih" />
              <YAxis />
              <Tooltip formatter={(value: number) => `${value} kcal`} />
              <Bar dataKey="kalori" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      
    </div>
  );
};

export default IstatistikSayfasi;*/
/*
import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from 'recharts';
import { supabase } from '../lib/supabase';
import dayjs from 'dayjs';

const IstatistikSayfasi: React.FC = () => {
  const [yukleniyor, setYukleniyor] = useState(true);
  const [gunlukKalori, setGunlukKalori] = useState<{ tarih: string; kalori: number }[]>([]);
  const [grafikTipi, setGrafikTipi] = useState<'bar' | 'line'>('bar');

  useEffect(() => {
    const veriGetir = async () => {
      setYukleniyor(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return setYukleniyor(false);

        const { data, error } = await supabase
          .from('kullanici_yemekleri')
          .select('created_at, kalori')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Veri alma hatası:', error);
          return setYukleniyor(false);
        }

        const ozet = data!.reduce((acc: { tarih: string; kalori: number }[], item) => {
          const tarih = dayjs(item.created_at).format('DD.MM.YYYY');
          const mevcut = acc.find(v => v.tarih === tarih);
          if (mevcut) {
            mevcut.kalori += item.kalori;
          } else {
            acc.push({ tarih, kalori: item.kalori });
          }
          return acc;
        }, []);

        setGunlukKalori(ozet);
      } catch (err) {
        console.error('Beklenmeyen hata:', err);
      } finally {
        setYukleniyor(false);
      }
    };

    veriGetir();
  }, []);

  if (yukleniyor) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold mb-4">İstatistikler</h1>

      <div className="flex gap-2 mb-2">
        <button
          onClick={() => setGrafikTipi('bar')}
          className={`px-4 py-2 rounded ${grafikTipi === 'bar' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
        >
          Bar Grafik
        </button>
        <button
          onClick={() => setGrafikTipi('line')}
          className={`px-4 py-2 rounded ${grafikTipi === 'line' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Çizgi Grafik
        </button>
      </div>

      <div className="bg-white rounded shadow p-4">
        <h2 className="text-lg font-semibold mb-3">Günlük Kalori Alımı</h2>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            {grafikTipi === 'bar' ? (
              <BarChart data={gunlukKalori}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="tarih" />
                <YAxis />
                <Tooltip formatter={(value: number) => `${value} kcal`} />
                <Bar dataKey="kalori" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <LineChart data={gunlukKalori}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="tarih" />
                <YAxis />
                <Tooltip formatter={(value: number) => `${value} kcal`} />
                <Line type="monotone" dataKey="kalori" stroke="#3b82f6" strokeWidth={2} dot />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default IstatistikSayfasi;*/
/*
import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis,
  Tooltip, CartesianGrid,
  ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { supabase } from '../lib/supabase';
import dayjs from 'dayjs';

type KaloriVerisi = {
  tarih: string;
  kalori: number;
  protein: number;
  karbonhidrat: number;
  yag: number;
};

const renkler = ['#10b981', '#3b82f6', '#f59e0b']; // Protein, Karbonhidrat, Yağ renkleri

const IstatistikSayfasi: React.FC = () => {
  const [yukleniyor, setYukleniyor] = useState(true);
  const [veri, setVeri] = useState<KaloriVerisi[]>([]);

  useEffect(() => {
    const veriGetir = async () => {
      setYukleniyor(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setYukleniyor(false);
          return;
        }

        // Kullanıcının tüm yemek kayıtlarını al, tarih sırasına göre
        const { data, error } = await supabase
          .from('kullanici_yemekleri')
          .select('created_at, kalori, protein, karbonhidrat, yag')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Veri alma hatası:', error);
          setYukleniyor(false);
          return;
        }

        // Günlük toplamları hesapla
        const ozet = data!.reduce((acc: KaloriVerisi[], item) => {
          const tarih = dayjs(item.created_at).format('DD.MM.YYYY');
          let mevcut = acc.find(v => v.tarih === tarih);
          if (mevcut) {
            mevcut.kalori += item.kalori;
            mevcut.protein += item.protein;
            mevcut.karbonhidrat += item.karbonhidrat;
            mevcut.yag += item.yag;
          } else {
            acc.push({
              tarih,
              kalori: item.kalori,
              protein: item.protein,
              karbonhidrat: item.karbonhidrat,
              yag: item.yag
            });
          }
          return acc;
        }, []);

        // Tarihe göre sırala (en eskiden en yeniye)
        ozet.sort((a, b) => dayjs(a.tarih, 'DD.MM.YYYY').unix() - dayjs(b.tarih, 'DD.MM.YYYY').unix());

        console.log('İşlenmiş veri:', ozet); // Debug için
        setVeri(ozet);
      } catch (err) {
        console.error('Beklenmeyen hata:', err);
      } finally {
        setYukleniyor(false);
      }
    };

    veriGetir();
  }, []);

  if (yukleniyor) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Yükleniyor...</p>
      </div>
    );
  }

  // Bugünün tarihi (format: DD.MM.YYYY)
  const bugun = dayjs().format('DD.MM.YYYY');
  // Bugün verisi
  const bugunVerisi = veri.find(v => v.tarih === bugun) ?? {
    tarih: bugun,
    kalori: 0,
    protein: 0,
    karbonhidrat: 0,
    yag: 0,
  };

  // Son 7 günün tarihlerini oluştur
  const son7GunTarihleri = Array.from({ length: 7 }, (_, i) => 
    dayjs().subtract(i, 'day').format('DD.MM.YYYY')
  );

  console.log('Son 7 gün tarihleri:', son7GunTarihleri); // Debug için

  // Son 7 günün verilerini filtrele
  const son7GunVeri = veri.filter(v => son7GunTarihleri.includes(v.tarih));

  console.log('Son 7 gün verisi:', son7GunVeri); // Debug için

  // Eksik günler için boş veri ekle (grafiklerde boşluk olmaması için)
  const tamamSon7GunVeri = son7GunTarihleri.map(tarih => {
    const mevcutVeri = son7GunVeri.find(v => v.tarih === tarih);
    return mevcutVeri || {
      tarih,
      kalori: 0,
      protein: 0,
      karbonhidrat: 0,
      yag: 0
    };
  }).reverse(); // En eskiden en yeniye sırala

  // Haftalık ortalama kalori (sadece veri olan günleri say)
  const veriOlanGunler = son7GunVeri.filter(v => v.kalori > 0);
  const haftalikOrtalamaKalori = veriOlanGunler.length > 0
    ? Math.round(veriOlanGunler.reduce((acc, v) => acc + v.kalori, 0) / veriOlanGunler.length)
    : 0;

  console.log('Haftalık ortalama kalori:', haftalikOrtalamaKalori); // Debug için

  // Günlük besin dağılımı pasta verisi (bugün)
  const besinDagilimPastaVeri = [
    { name: 'Protein', value: bugunVerisi.protein },
    { name: 'Karbonhidrat', value: bugunVerisi.karbonhidrat },
    { name: 'Yağ', value: bugunVerisi.yag },
  ];

  // Günlük besin trendi için veri
  const trendVeri = tamamSon7GunVeri.map(v => ({
    tarih: v.tarih,
    Protein: v.protein,
    Karbonhidrat: v.karbonhidrat,
    Yağ: v.yag,
  }));

  console.log('Trend verisi:', trendVeri); // Debug için

  return (
    <div className="space-y-8 p-4 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">İstatistikler</h1>

 
      <section className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Günlük Toplam Kalori</h2>
        <p className="mb-4 text-lg">Bugün aldığınız kalori: <strong>{bugunVerisi.kalori.toFixed(0)} kcal</strong></p>
        {veri.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={veri}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="tarih" />
              <YAxis />
              <Tooltip formatter={(value: number) => `${value} kcal`} />
              <Bar dataKey="kalori" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500">Henüz veri bulunamadı.</p>
        )}
      </section>


      <section className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Günlük Besin Dağılımı (Bugün)</h2>
        {bugunVerisi.kalori === 0 ? (
          <p className="text-gray-500">Bugün veri bulunamadı.</p>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={besinDagilimPastaVeri}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                fill="#8884d8"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {besinDagilimPastaVeri.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={renkler[index % renkler.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip formatter={(value: number) => `${value.toFixed(1)} gr`} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </section>


      <section className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Haftalık Ortalama Kalori (Son 7 Gün)</h2>
        <p className="mb-4 text-lg">
          Ortalama kalori: <strong>{haftalikOrtalamaKalori} kcal</strong>
          {veriOlanGunler.length > 0 && (
            <span className="text-sm text-gray-600 ml-2">
              ({veriOlanGunler.length} günlük veriye dayalı)
            </span>
          )}
        </p>
        {tamamSon7GunVeri.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={tamamSon7GunVeri}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="tarih" />
              <YAxis />
              <Tooltip formatter={(value: number) => `${value} kcal`} />
              <Line 
                type="monotone" 
                dataKey="kalori" 
                stroke="#10b981" 
                strokeWidth={3}
                connectNulls={false}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500">Son 7 günde veri bulunamadı.</p>
        )}
      </section>


      <section className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Günlük Besin Trendleri (Son 7 Gün)</h2>
        {trendVeri.length > 0 && trendVeri.some(v => v.Protein > 0 || v.Karbonhidrat > 0 || v.Yağ > 0) ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendVeri}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="tarih" />
              <YAxis />
              <Tooltip formatter={(value: number) => `${value.toFixed(1)} gr`} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="Protein" 
                stroke={renkler[0]} 
                strokeWidth={2}
                connectNulls={false}
                dot={{ r: 3 }}
              />
              <Line 
                type="monotone" 
                dataKey="Karbonhidrat" 
                stroke={renkler[1]} 
                strokeWidth={2}
                connectNulls={false}
                dot={{ r: 3 }}
              />
              <Line 
                type="monotone" 
                dataKey="Yağ" 
                stroke={renkler[2]} 
                strokeWidth={2}
                connectNulls={false}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500">Son 7 günde besin verisi bulunamadı.</p>
        )}
      </section>
    </div>
  );
  
};

export default IstatistikSayfasi;*/

import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis,
  Tooltip, CartesianGrid,
  ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { supabase } from '../lib/supabase';
import dayjs from 'dayjs';

type KaloriVerisi = {
  tarih: string;
  kalori: number;
  protein: number;
  karbonhidrat: number;
  yag: number;
};

const renkler = ['#10b981', '#3b82f6', '#f59e0b']; // Protein, Karbonhidrat, Yağ renkleri

const IstatistikSayfasi: React.FC = () => {
  const [yukleniyor, setYukleniyor] = useState(true);
  const [veri, setVeri] = useState<KaloriVerisi[]>([]);
  const [hata, setHata] = useState('');

  useEffect(() => {
    const veriGetir = async () => {
      setYukleniyor(true);
      setHata('');
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setHata('Kullanıcı oturumu bulunamadı');
          setYukleniyor(false);
          return;
        }

        // Kullanıcının tüm yemek kayıtlarını al, tarih sütunundan tarihi al
        const { data, error } = await supabase
          .from('kullanici_yemekleri')
          .select('tarih, kalori, protein, karbonhidrat, yag') // tarih sütununu kullan
          .eq('user_id', user.id)
          .order('tarih', { ascending: true }); // tarih sütununa göre sırala

        if (error) {
          console.error('Veri alma hatası:', error);
          setHata('Veriler alınırken bir hata oluştu: ' + error.message);
          setYukleniyor(false);
          return;
        }

        if (!data || data.length === 0) {
          console.log('Veri bulunamadı');
          setVeri([]);
          setYukleniyor(false);
          return;
        }

        // Günlük toplamları hesapla
        const ozet = data.reduce((acc: KaloriVerisi[], item) => {
          // Tarih sütunundaki veriyi format olarak kontrol et
          let tarihStr: string;
          if (item.tarih) {
            // Eğer tarih YYYY-MM-DD formatındaysa, DD.MM.YYYY'ye çevir
            if (item.tarih.includes('-')) {
              tarihStr = dayjs(item.tarih).format('DD.MM.YYYY');
            } else {
              tarihStr = item.tarih;
            }
          } else {
            // Eğer tarih yoksa bugünün tarihini kullan
            tarihStr = dayjs().format('DD.MM.YYYY');
          }

          let mevcut = acc.find(v => v.tarih === tarihStr);
          if (mevcut) {
            mevcut.kalori += item.kalori || 0;
            mevcut.protein += item.protein || 0;
            mevcut.karbonhidrat += item.karbonhidrat || 0;
            mevcut.yag += item.yag || 0;
          } else {
            acc.push({
              tarih: tarihStr,
              kalori: item.kalori || 0,
              protein: item.protein || 0,
              karbonhidrat: item.karbonhidrat || 0,
              yag: item.yag || 0
            });
          }
          return acc;
        }, []);

        // Tarihe göre sırala (en eskiden en yeniye)
        ozet.sort((a, b) => {
          const tarihA = dayjs(a.tarih, 'DD.MM.YYYY');
          const tarihB = dayjs(b.tarih, 'DD.MM.YYYY');
          return tarihA.unix() - tarihB.unix();
        });

        console.log('İşlenmiş veri:', ozet); // Debug için
        setVeri(ozet);
      } catch (err: any) {
        console.error('Beklenmeyen hata:', err);
        setHata('Beklenmeyen bir hata oluştu: ' + err.message);
      } finally {
        setYukleniyor(false);
      }
    };

    veriGetir();
  }, []);

  if (yukleniyor) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">İstatistikler yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (hata) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-red-600">{hata}</p>
        </div>
      </div>
    );
  }

  // Bugünün tarihi (format: DD.MM.YYYY)
  const bugun = dayjs().format('DD.MM.YYYY');
  // Bugün verisi
  const bugunVerisi = veri.find(v => v.tarih === bugun) ?? {
    tarih: bugun,
    kalori: 0,
    protein: 0,
    karbonhidrat: 0,
    yag: 0,
  };

  // Son 7 günün tarihlerini oluştur
  const son7GunTarihleri = Array.from({ length: 7 }, (_, i) => 
    dayjs().subtract(i, 'day').format('DD.MM.YYYY')
  );

  console.log('Son 7 gün tarihleri:', son7GunTarihleri); // Debug için

  // Son 7 günün verilerini filtrele
  const son7GunVeri = veri.filter(v => son7GunTarihleri.includes(v.tarih));

  console.log('Son 7 gün verisi:', son7GunVeri); // Debug için

  // Eksik günler için boş veri ekle (grafiklerde boşluk olmaması için)
  const tamamSon7GunVeri = son7GunTarihleri.map(tarih => {
    const mevcutVeri = son7GunVeri.find(v => v.tarih === tarih);
    return mevcutVeri || {
      tarih,
      kalori: 0,
      protein: 0,
      karbonhidrat: 0,
      yag: 0
    };
  }).reverse(); // En eskiden en yeniye sırala

  // Haftalık ortalama kalori (sadece veri olan günleri say)
  const veriOlanGunler = son7GunVeri.filter(v => v.kalori > 0);
  const haftalikOrtalamaKalori = veriOlanGunler.length > 0
    ? Math.round(veriOlanGunler.reduce((acc, v) => acc + v.kalori, 0) / veriOlanGunler.length)
    : 0;

  console.log('Haftalık ortalama kalori:', haftalikOrtalamaKalori); // Debug için

  // Günlük besin dağılımı pasta verisi (bugün)
  const besinDagilimPastaVeri = [
    { name: 'Protein', value: bugunVerisi.protein },
    { name: 'Karbonhidrat', value: bugunVerisi.karbonhidrat },
    { name: 'Yağ', value: bugunVerisi.yag },
  ].filter(item => item.value > 0); // Sadece değeri olan besinleri göster

  // Günlük besin trendi için veri
  const trendVeri = tamamSon7GunVeri.map(v => ({
    tarih: v.tarih,
    Protein: v.protein,
    Karbonhidrat: v.karbonhidrat,
    Yağ: v.yag,
  }));

  console.log('Trend verisi:', trendVeri); // Debug için

  // Toplam kalori hesapla
  const toplamKalori = veri.reduce((acc, v) => acc + v.kalori, 0);
  const toplamGun = veri.filter(v => v.kalori > 0).length;
  const genelOrtalama = toplamGun > 0 ? Math.round(toplamKalori / toplamGun) : 0;

  return (
    <div className="space-y-8 p-4 max-w-5xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">İstatistikler</h1>
        <p className="text-gray-600">Beslenme alışkanlıklarınızın detaylı analizi</p>
      </div>

      {/* Özet Kartlar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm text-gray-600">Bugün</p>
              <p className="text-2xl font-bold text-gray-900">{bugunVerisi.kalori}</p>
              <p className="text-xs text-gray-500">kalori</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm text-gray-600">7 Gün Ort.</p>
              <p className="text-2xl font-bold text-gray-900">{haftalikOrtalamaKalori}</p>
              <p className="text-xs text-gray-500">kalori</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm text-gray-600">Genel Ort.</p>
              <p className="text-2xl font-bold text-gray-900">{genelOrtalama}</p>
              <p className="text-xs text-gray-500">kalori</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm text-gray-600">Aktif Gün</p>
              <p className="text-2xl font-bold text-gray-900">{toplamGun}</p>
              <p className="text-xs text-gray-500">gün</p>
            </div>
          </div>
        </div>
      </div>

      {/* Günlük Toplam Kalori */}
      <section className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Günlük Toplam Kalori</h2>
        <p className="mb-4 text-lg text-gray-600">
          Bugün aldığınız kalori: <strong className="text-green-600">{bugunVerisi.kalori.toFixed(0)} kcal</strong>
        </p>
        {veri.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={veri}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="tarih" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [`${value} kcal`, 'Kalori']}
                labelFormatter={(label) => `Tarih: ${label}`}
              />
              <Bar dataKey="kalori" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Henüz veri bulunamadı.</p>
            <p className="text-sm text-gray-400 mt-2">Yemek eklemeye başlayarak istatistiklerinizi görüntüleyebilirsiniz.</p>
          </div>
        )}
      </section>

      {/* Günlük Besin Dağılımı */}
      <section className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Günlük Besin Dağılımı (Bugün)</h2>
        {bugunVerisi.kalori === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Bugün veri bulunamadı.</p>
            <p className="text-sm text-gray-400 mt-2">Bugün yemek ekleyerek besin dağılımınızı görüntüleyebilirsiniz.</p>
          </div>
        ) : besinDagilimPastaVeri.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Besin değerleri girilmemiş.</p>
            <p className="text-sm text-gray-400 mt-2">Yemek eklerken protein, karbonhidrat ve yağ değerlerini de girin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={besinDagilimPastaVeri}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  fill="#8884d8"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {besinDagilimPastaVeri.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={renkler[index % renkler.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip formatter={(value: number) => `${value.toFixed(1)} gr`} />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="flex flex-col justify-center space-y-4">
              {besinDagilimPastaVeri.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div 
                      className="w-4 h-4 rounded-full mr-3"
                      style={{ backgroundColor: renkler[index % renkler.length] }}
                    ></div>
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <span className="text-lg font-bold">{item.value.toFixed(1)}g</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Haftalık Ortalama Kalori */}
      <section className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Haftalık Kalori Trendi (Son 7 Gün)</h2>
        <p className="mb-4 text-lg text-gray-600">
          Ortalama kalori: <strong className="text-blue-600">{haftalikOrtalamaKalori} kcal</strong>
          {veriOlanGunler.length > 0 && (
            <span className="text-sm text-gray-500 ml-2">
              ({veriOlanGunler.length} günlük veriye dayalı)
            </span>
          )}
        </p>
        {tamamSon7GunVeri.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={tamamSon7GunVeri}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="tarih" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [`${value} kcal`, 'Kalori']}
                labelFormatter={(label) => `Tarih: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="kalori" 
                stroke="#3b82f6" 
                strokeWidth={3}
                connectNulls={false}
                dot={{ r: 5, fill: '#3b82f6' }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Son 7 günde veri bulunamadı.</p>
          </div>
        )}
      </section>

      {/* Günlük Besin Trendleri */}
      <section className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Günlük Besin Trendleri (Son 7 Gün)</h2>
        {trendVeri.length > 0 && trendVeri.some(v => v.Protein > 0 || v.Karbonhidrat > 0 || v.Yağ > 0) ? (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={trendVeri}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="tarih" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [`${value.toFixed(1)} gr`]}
                labelFormatter={(label) => `Tarih: ${label}`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="Protein" 
                stroke={renkler[0]} 
                strokeWidth={2}
                connectNulls={false}
                dot={{ r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="Karbonhidrat" 
                stroke={renkler[1]} 
                strokeWidth={2}
                connectNulls={false}
                dot={{ r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="Yağ" 
                stroke={renkler[2]} 
                strokeWidth={2}
                connectNulls={false}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Son 7 günde besin verisi bulunamadı.</p>
            <p className="text-sm text-gray-400 mt-2">Yemek eklerken besin değerlerini de girerek trendleri görüntüleyebilirsiniz.</p>
          </div>
        )}
      </section>
    </div>
  );
  
};

export default IstatistikSayfasi;