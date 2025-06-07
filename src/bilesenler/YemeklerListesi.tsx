import { useState, useEffect } from 'react';
import { Trash2, RefreshCw, Calendar, CalendarDays, Clock, Utensils, Apple, Coffee, Pizza, Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

// Kategori simgeleri
const iconMap = {
  Kahvaltı: <Coffee className="text-amber-500" size={20} />,
  Öğle: <Utensils className="text-green-600" size={20} />,
  Akşam: <Pizza className="text-red-500" size={20} />,
  Atıştırmalık: <Apple className="text-yellow-500" size={20} />,
  Meyve: <Apple className="text-pink-500" size={20} />,
};

// Kalori oranları - normal diyet için
const normalOranlar = {
  Kahvaltı: 0.20,
  Öğle: 0.35,
  Akşam: 0.30,
  Atıştırmalık: 0.10,
  Meyve: 0.05,
};

// Haftanın günleri
const gunler = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

const YemekOnerisiSayfasi = () => {
  const [userCalories, setUserCalories] = useState(2000);
  const [yemekler, setYemekler] = useState([]);
  const [gorunumTipi, setGorunumTipi] = useState('gunluk');
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState('');
  const [oneriler, setOneriler] = useState({});
  const [yenilenenKategori, setYenilenenKategori] = useState('');

  // Kullanıcı verilerini ve yemekleri getir
  useEffect(() => {
    const veriGetir = async () => {
      setYukleniyor(true);
      try {
        // Kullanıcı profili getir
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setHata('Kullanıcı oturumu bulunamadı');
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('hedef_kalori')
          .eq('user_id', user.id)
          .single();

        if (profile?.hedef_kalori) {
          setUserCalories(profile.hedef_kalori);
        }

        // Yemekler tablosundan verileri getir
        const { data: yemekData, error: yemekError } = await supabase
          .from('yemekler')
          .select('*');

        if (yemekError) {
          setHata('Yemek verileri alınamadı: ' + yemekError.message);
          return;
        }

        console.log('Yemek verileri:', yemekData); // Debug
        setYemekler(yemekData || []);
        
        // İlk önerileri oluştur
        if (yemekData && yemekData.length > 0) {
          olusturOneriler(yemekData);
        }
        
      } catch (err) {
        console.error('Veri getirme hatası:', err);
        setHata('Veriler alınırken bir hata oluştu');
      } finally {
        setYukleniyor(false);
      }
    };

    veriGetir();
  }, []);

  // Önerileri oluştur
  const olusturOneriler = (yemekListesi = yemekler) => {
    if (!yemekListesi.length) return;

    const yeniOneriler = {};
    const kategoriler = Object.keys(normalOranlar);
    
    if (gorunumTipi === 'gunluk') {
      kategoriler.forEach(kategori => {
        yeniOneriler[kategori] = rastgeleYemekSec(kategori, yemekListesi);
      });
    } else if (gorunumTipi === 'haftalik') {
      gunler.forEach(gun => {
        yeniOneriler[gun] = {};
        kategoriler.forEach(kategori => {
          yeniOneriler[gun][kategori] = rastgeleYemekSec(kategori, yemekListesi);
        });
      });
    } else { // aylık
      for (let gun = 1; gun <= 30; gun++) {
        yeniOneriler[`Gün ${gun}`] = {};
        kategoriler.forEach(kategori => {
          yeniOneriler[`Gün ${gun}`][kategori] = rastgeleYemekSec(kategori, yemekListesi);
        });
      }
    }
    
    setOneriler(yeniOneriler);
  };

  // Rastgele yemek seç
  const rastgeleYemekSec = (kategori, yemekListesi) => {
    const hedefKalori = userCalories * normalOranlar[kategori];
    const kategoriYemekleri = yemekListesi.filter(y => y.kategori === kategori);
    
    if (kategoriYemekleri.length === 0) return [];
    
    const seciliYemekler = [];
    let toplamKalori = 0;
    const kullanilan = new Set();
    
    while (toplamKalori < hedefKalori && kullanilan.size < kategoriYemekleri.length) {
      const rastgeleIndex = Math.floor(Math.random() * kategoriYemekleri.length);
      const yemek = kategoriYemekleri[rastgeleIndex];
      
      if (!kullanilan.has(yemek.id) && (toplamKalori + yemek.kalori) <= hedefKalori * 1.2) {
        seciliYemekler.push(yemek);
        toplamKalori += yemek.kalori;
        kullanilan.add(yemek.id);
      } else {
        kullanilan.add(yemek.id);
      }
    }
    
    return seciliYemekler;
  };

  // Kategori yenile
  const kategoriYenile = (kategori, gun = null) => {
    setYenilenenKategori(gun ? `${gun}-${kategori}` : kategori);
    
    setTimeout(() => {
      const yeniOneriler = { ...oneriler };
      
      if (gorunumTipi === 'gunluk') {
        yeniOneriler[kategori] = rastgeleYemekSec(kategori, yemekler);
      } else {
        yeniOneriler[gun][kategori] = rastgeleYemekSec(kategori, yemekler);
      }
      
      setOneriler(yeniOneriler);
      setYenilenenKategori('');
    }, 500);
  };

  // Yemek sil
  const yemekSil = (silinecekYemek, kategori, gun = null) => {
    const yeniOneriler = { ...oneriler };
    
    if (gorunumTipi === 'gunluk') {
      yeniOneriler[kategori] = yeniOneriler[kategori].filter(y => y.id !== silinecekYemek.id);
    } else {
      yeniOneriler[gun][kategori] = yeniOneriler[gun][kategori].filter(y => y.id !== silinecekYemek.id);
    }
    
    setOneriler(yeniOneriler);
  };

  // Görünüm değiştir
  const gorunumDegistir = (yeniGorunum) => {
    setGorunumTipi(yeniGorunum);
    setTimeout(() => olusturOneriler(), 100);
  };

  // PDF olarak yazdır
  const pdfOlarakYazdir = () => {
    // Yazdırma öncesi hazırlık
    document.body.classList.add('printing');
    
    // Kısa bir gecikme ile yazdırma dialogunu aç
    setTimeout(() => {
      window.print();
      
      // Yazdırma işlemi bittikten sonra class'ı kaldır
      setTimeout(() => {
        document.body.classList.remove('printing');
      }, 1000);
    }, 500);
  };

  // Günlük görünüm
  const renderGunlukGorunum = () => {
    const kategoriler = Object.keys(normalOranlar);
    
    return (
      <div className="grid gap-6">
        {kategoriler.map((kategori) => {
          const kategoriYemekleri = oneriler[kategori] || [];
          const hedefKalori = Math.round(userCalories * normalOranlar[kategori]);
          const mevcutKalori = kategoriYemekleri.reduce((top, y) => top + y.kalori, 0);
          
          return (
            <motion.div
              key={kategori}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 print-category"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="no-print">{iconMap[kategori]}</span>
                  <h2 className="text-xl font-semibold text-gray-800 print-category-title">{kategori}</h2>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                    {mevcutKalori} / {hedefKalori} kcal
                  </span>
                  <button
                    onClick={() => kategoriYenile(kategori)}
                    disabled={yenilenenKategori === kategori}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors no-print"
                  >
                    <RefreshCw 
                      size={18} 
                      className={`text-gray-600 ${yenilenenKategori === kategori ? 'animate-spin' : ''}`} 
                    />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 print-food-grid">
                {kategoriYemekleri.map((yemek, index) => (
                  <motion.div
                    key={`${yemek.id}-${index}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all group print-food-item"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-medium text-gray-800 text-sm print-food-name">{yemek.ad}</h3>
                      <button
                        onClick={() => yemekSil(yemek, kategori)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded-full transition-all no-print"
                      >
                        <Trash2 size={14} className="text-red-500" />
                      </button>
                    </div>
                    
                    <div className="space-y-2 print-nutrition">
                      <div className="flex justify-between text-xs print-nutrition-item">
                        <span className="text-gray-600">Kalori</span>
                        <span className="font-medium text-orange-600">{yemek.kalori} kcal</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 print-nutrition">
                        <div className="text-center print-nutrition-item">
                          <div className="text-xs text-gray-500">Protein</div>
                          <div className="text-sm font-medium text-blue-600">{yemek.protein}g</div>
                        </div>
                        <div className="text-center print-nutrition-item">
                          <div className="text-xs text-gray-500">Karb</div>
                          <div className="text-sm font-medium text-yellow-600">{yemek.karbonhidrat}g</div>
                        </div>
                        <div className="text-center print-nutrition-item">
                          <div className="text-xs text-gray-500">Yağ</div>
                          <div className="text-sm font-medium text-red-600">{yemek.yag}g</div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {kategoriYemekleri.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">Bu kategori için öneri bulunamadı</p>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    );
  };

  // Haftalık görünüm
  const renderHaftalikGorunum = () => {
    return (
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r  to-blue-100">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-blue-800">Gün</th>
                {Object.keys(normalOranlar).map(kategori => (
                  <th key={kategori} className="px-4 py-3 text-left font-semibold text-blue-800">
                    <div className="flex items-center gap-2">
                      {iconMap[kategori]}
                      <span className="hidden md:block">{kategori}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gunler.map((gun, gunIndex) => (
                <tr key={gun} className={gunIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="px-4 py-4 font-medium text-gray-700 border-b">
                    {gun}
                  </td>
                  {Object.keys(normalOranlar).map(kategori => {
                    const gunOnerileri = oneriler[gun]?.[kategori] || [];
                    return (
                      <td key={kategori} className="px-4 py-4 border-b">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              {gunOnerileri.reduce((t, y) => t + y.kalori, 0)} kcal
                            </span>
                            <button
                              onClick={() => kategoriYenile(kategori, gun)}
                              className="p-1 hover:bg-gray-200 rounded"
                            >
                              <RefreshCw 
                                size={12} 
                                className={`text-gray-500 ${yenilenenKategori === `${gun}-${kategori}` ? 'animate-spin' : ''}`} 
                              />
                            </button>
                          </div>
                          <div className="space-y-1">
                            {gunOnerileri.map((yemek, index) => (
                              <div key={index} className="flex items-center justify-between bg-white px-2 py-1 rounded text-xs group">
                                <span className="truncate flex-1">{yemek.ad}</span>
                                <button
                                  onClick={() => yemekSil(yemek, kategori, gun)}
                                  className="opacity-0 group-hover:opacity-100 ml-1"
                                >
                                  <Trash2 size={10} className="text-red-500" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Aylık görünüm
  const renderAylikGorunum = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 30 }, (_, i) => i + 1).map(gun => {
          const gunKey = `Gün ${gun}`;
          const gunOnerileri = oneriler[gunKey] || {};
          
          return (
            <motion.div
              key={gun}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-md p-4 border border-gray-100"
            >
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 -mx-4 -mt-4 px-4 py-2 mb-4 rounded-t-xl">
                <h3 className="font-semibold text-white text-center">Gün {gun}</h3>
              </div>
              
              <div className="space-y-3">
                {Object.keys(normalOranlar).map(kategori => {
                  const kategoriYemekleri = gunOnerileri[kategori] || [];
                  const toplamKalori = kategoriYemekleri.reduce((t, y) => t + y.kalori, 0);
                  
                  return (
                    <div key={kategori} className="border-b border-gray-100 pb-2 last:border-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1">
                          {iconMap[kategori]}
                          <span className="text-xs font-medium text-gray-700">{kategori}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-500">{toplamKalori} kcal</span>
                          <button
                            onClick={() => kategoriYenile(kategori, gunKey)}
                            className="p-0.5 hover:bg-gray-100 rounded"
                          >
                            <RefreshCw 
                              size={10} 
                              className={`text-gray-500 ${yenilenenKategori === `${gunKey}-${kategori}` ? 'animate-spin' : ''}`} 
                            />
                          </button>
                        </div>
                      </div>
                      
                      <div className="ml-2 space-y-1">
                        {kategoriYemekleri.map((yemek, index) => (
                          <div key={index} className="flex items-center justify-between text-xs group">
                            <span className="truncate flex-1 text-gray-600">{yemek.ad}</span>
                            <button
                              onClick={() => yemekSil(yemek, kategori, gunKey)}
                              className="opacity-0 group-hover:opacity-100 ml-1"
                            >
                              <Trash2 size={8} className="text-red-500" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  };

  if (yukleniyor) {
    return (
      <div className="min-h-screen bg-gradient-to-br  to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Yemek önerileri hazırlanıyor...</p>
        </div>
      </div>
    );
  }

  if (hata) {
    return (
      <div className="min-h-screen bg-gradient-to-br to-white flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
          <div className="text-red-500 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-red-600 font-medium">{hata}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Print CSS */}
      <style jsx global>{`
        @media print {
          body.printing {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          @page {
            margin: 0.5in;
            size: A4;
          }
          
          .no-print {
            display: none !important;
          }
          
          .print-title {
            display: block !important;
            text-align: center;
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #1f2937 !important;
          }
          
          .print-subtitle {
            display: block !important;
            text-align: center;
            font-size: 12px;
            color: #6b7280 !important;
            margin-bottom: 20px;
          }
          
          /* Günlük görünüm - kompakt */
          .print-daily-table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 10px !important;
            margin-bottom: 20px !important;
          }
          
          .print-daily-table th {
            background: #f3f4f6 !important;
            border: 1px solid #d1d5db !important;
            padding: 8px 4px !important;
            font-weight: 600 !important;
            text-align: left !important;
          }
          
          .print-daily-table td {
            border: 1px solid #d1d5db !important;
            padding: 6px 4px !important;
            vertical-align: top !important;
          }
          
          /* Haftalık görünüm - kompakt */
          .print-weekly-table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 9px !important;
            margin-bottom: 15px !important;
          }
          
          .print-weekly-table th,
          .print-weekly-table td {
            border: 1px solid #d1d5db !important;
            padding: 4px 2px !important;
            text-align: left !important;
            vertical-align: top !important;
          }
          
          .print-weekly-table th {
            background: #f3f4f6 !important;
            font-weight: 600 !important;
          }
          
          /* Aylık görünüm - çok kompakt tablo */
          .print-monthly-table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 8px !important;
            line-height: 1.2 !important;
          }
          
          .print-monthly-table th,
          .print-monthly-table td {
            border: 1px solid #d1d5db !important;
            padding: 3px 2px !important;
            text-align: left !important;
            vertical-align: top !important;
          }
          
          .print-monthly-table th {
            background: #f3f4f6 !important;
            font-weight: 600 !important;
            text-align: center !important;
          }
          
          .print-food-list {
            margin: 0 !important;
            padding: 0 !important;
            list-style: none !important;
          }
          
          .print-food-item-compact {
            margin-bottom: 2px !important;
            font-size: 8px !important;
            line-height: 1.1 !important;
          }
          
          .print-food-name {
            font-weight: 600 !important;
            color: #1f2937 !important;
          }
          
          .print-food-calories {
            color: #dc2626 !important;
            font-weight: 500 !important;
          }
          
          .print-category-total {
            font-weight: 600 !important;
            color: #1f2937 !important;
            border-top: 2px solid #6b7280 !important;
            background: #f9fafb !important;
          }
          
          .print-date {
            display: block !important;
            text-align: right;
            font-size: 10px;
            color: #6b7280 !important;
            margin-top: 15px;
          }
        }
        
        .print-only {
          display: none;
        }
        
        @media print {
          .print-only {
            display: block !important;
          }
          
          .screen-only {
            display: none !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br  to-white p-6" id="yemek-onerileri">
        <div className="max-w-7xl mx-auto">
          {/* Print için özel başlık */}
          <div className="print-only">
            <h1 className="print-title">Kişisel Beslenme Planı</h1>
            <p className="print-subtitle">
              Hedef Kalori: {userCalories} kcal | Plan Tipi: {
                gorunumTipi === 'gunluk' ? 'Günlük' : 
                gorunumTipi === 'haftalik' ? 'Haftalık' : 'Aylık'
              }
            </p>
            
            {/* Günlük görünüm için kompakt tablo */}
            {gorunumTipi === 'gunluk' && (
              <table className="print-daily-table">
                <thead>
                  <tr>
                    <th style={{ width: '20%' }}>Kategori</th>
                    <th style={{ width: '50%' }}>Yemekler</th>
                    <th style={{ width: '15%' }}>Kalori</th>
                    <th style={{ width: '15%' }}>P/K/Y (g)</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(normalOranlar).map(kategori => {
                    const kategoriYemekleri = oneriler[kategori] || [];
                    const toplamKalori = kategoriYemekleri.reduce((t, y) => t + y.kalori, 0);
                    const toplamProtein = kategoriYemekleri.reduce((t, y) => t + y.protein, 0);
                    const toplamKarb = kategoriYemekleri.reduce((t, y) => t + y.karbonhidrat, 0);
                    const toplamYag = kategoriYemekleri.reduce((t, y) => t + y.yag, 0);
                    
                    return (
                      <tr key={kategori}>
                        <td style={{ fontWeight: '600' }}>{kategori}</td>
                        <td>
                          {kategoriYemekleri.map((yemek, i) => (
                            <div key={i} className="print-food-item-compact">
                              <span className="print-food-name">{yemek.ad}</span> 
                              <span className="print-food-calories"> ({yemek.kalori} kcal)</span>
                            </div>
                          ))}
                        </td>
                        <td style={{ fontWeight: '600', color: '#dc2626' }}>{toplamKalori}</td>
                        <td>{toplamProtein.toFixed(1)}/{toplamKarb.toFixed(1)}/{toplamYag.toFixed(1)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            
            {/* Haftalık görünüm için kompakt tablo */}
            {gorunumTipi === 'haftalik' && (
              <table className="print-weekly-table">
                <thead>
                  <tr>
                    <th style={{ width: '12%' }}>Gün</th>
                    {Object.keys(normalOranlar).map(kategori => (
                      <th key={kategori} style={{ width: '22%' }}>{kategori}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {gunler.map(gun => (
                    <tr key={gun}>
                      <td style={{ fontWeight: '600' }}>{gun}</td>
                      {Object.keys(normalOranlar).map(kategori => {
                        const gunOnerileri = oneriler[gun]?.[kategori] || [];
                        const toplamKalori = gunOnerileri.reduce((t, y) => t + y.kalori, 0);
                        return (
                          <td key={kategori}>
                            {gunOnerileri.map((yemek, i) => (
                              <div key={i} className="print-food-item-compact">
                                {yemek.ad} ({yemek.kalori})
                              </div>
                            ))}
                            {toplamKalori > 0 && (
                              <div style={{ marginTop: '2px', fontWeight: '600', color: '#dc2626' }}>
                                Toplam: {toplamKalori} kcal
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            
            {/* Aylık görünüm için ultra kompakt tablo */}
            {gorunumTipi === 'aylik' && (
              <table className="print-monthly-table">
                <thead>
                  <tr>
                    <th rowSpan="2" style={{ width: '8%' }}>Gün</th>
                    {Object.keys(normalOranlar).map(kategori => (
                      <th key={kategori} style={{ width: '23%' }}>{kategori}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 30 }, (_, i) => i + 1).map(gun => {
                    const gunKey = `Gün ${gun}`;
                    const gunOnerileri = oneriler[gunKey] || {};
                    
                    return (
                      <tr key={gun}>
                        <td style={{ fontWeight: '600', textAlign: 'center' }}>{gun}</td>
                        {Object.keys(normalOranlar).map(kategori => {
                          const kategoriYemekleri = gunOnerileri[kategori] || [];
                          const toplamKalori = kategoriYemekleri.reduce((t, y) => t + y.kalori, 0);
                          
                          return (
                            <td key={kategori}>
                              {kategoriYemekleri.slice(0, 2).map((yemek, i) => (
                                <div key={i} className="print-food-item-compact">
                                  {yemek.ad.length > 15 ? yemek.ad.substring(0, 12) + '...' : yemek.ad} ({yemek.kalori})
                                </div>
                              ))}
                              {kategoriYemekleri.length > 2 && (
                                <div className="print-food-item-compact">
                                  +{kategoriYemekleri.length - 2} daha...
                                </div>
                              )}
                              {toplamKalori > 0 && (
                                <div style={{ marginTop: '1px', fontWeight: '600', fontSize: '7px', color: '#dc2626' }}>
                                  T: {toplamKalori}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 no-print"
        >
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Yemek Önerileri</h1>
          <p className="text-gray-600">Hedef kaloriniz: <span className="font-semibold text-blue-600">{userCalories} kcal</span></p>
        </motion.div>

        {/* Görünüm Seçici */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-8 no-print">
          <div className="flex justify-center">
            <div className="flex bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => gorunumDegistir('gunluk')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  gorunumTipi === 'gunluk' 
                    ? 'bg-blue-500 text-white shadow-md' 
                    : 'hover:bg-gray-200 text-gray-700'
                }`}
              >
                <Clock size={18} />
                Günlük
              </button>
              <button
                onClick={() => gorunumDegistir('haftalik')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  gorunumTipi === 'haftalik' 
                    ? 'bg-blue-500 text-white shadow-md' 
                    : 'hover:bg-gray-200 text-gray-700'
                }`}
              >
                <CalendarDays size={18} />
                Haftalık
              </button>
              <button
                onClick={() => gorunumDegistir('aylik')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  gorunumTipi === 'aylik' 
                    ? 'bg-blue-500 text-white shadow-md' 
                    : 'hover:bg-gray-200 text-gray-700'
                }`}
              >
                <Calendar size={18} />
                Aylık
              </button>
            </div>
          </div>
        </div>

        {/* İçerik */}
        <div className="screen-only">
          <AnimatePresence mode="wait">
            <motion.div
              key={gorunumTipi}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {gorunumTipi === 'gunluk' && renderGunlukGorunum()}
              {gorunumTipi === 'haftalik' && renderHaftalikGorunum()}
              {gorunumTipi === 'aylik' && renderAylikGorunum()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* PDF İndir ve Yenile Butonları */}
        <div className="flex justify-center gap-4 mt-8 no-print">
          <button
            onClick={pdfOlarakYazdir}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
          >
            <Printer size={20} />
            PDF Olarak İndir
          </button>
          
          <button
            onClick={() => olusturOneriler()}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
          >
            <RefreshCw size={20} />
            Tüm Önerileri Yenile
          </button>
        </div>

        {/* Print için tarih */}
        <div className="print-only">
          <p className="print-date">
            Oluşturma Tarihi: {new Date().toLocaleDateString('tr-TR', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>
    </div>
    </>
  );
};

export default YemekOnerisiSayfasi;