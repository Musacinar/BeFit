
/*
  import React, { createContext, useContext, useState, useEffect } from 'react';
  import { Yemek, YemekBaglamiDegerleri, YemekVeritabani } from '../tipler';
  import { kaydetYemekler, getirYemekler } from '../depolama';
  import { bugunTarih, rastgeleId, hesaplaGunlukOzet } from '../yardimcilar';
  import { supabase } from '../lib/supabase';

  const YemekBaglami = createContext<YemekBaglamiDegerleri | undefined>(undefined);

  export const YemekSaglayici: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [yemekler, setYemekler] = useState<Yemek[]>([]);
    const [hazirYemekler, setHazirYemekler] = useState<YemekVeritabani[]>([]);
    const [ogunKategorileri, setOgunKategorileri] = useState<string[]>(['Kahvaltı', 'Öğle Yemeği', 'Akşam Yemeği', 'Ara Öğün']);




    // Kullanıcının yediği yemekleri Supabase'den çek
    const getirKullaniciYemekleri = async () => {
      try {
        // Önce oturum açmış kullanıcıyı al
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        
        if (!user) {
          console.log('Kullanıcı giriş yapmamış');
          return; // Kullanıcı giriş yapmamışsa çık
        }

        // Kullanıcının yemeklerini çek
        const { data, error } = await supabase
          .from('kullanici_yemekleri')
          .select('*')
          .eq('user_id', user.id);
        
        if (error) {
          console.error('Kullanıcı yemekleri yüklenirken hata:', error);
          return;
        }
        
        // Veritabanından gelen yemekleri Yemek formatına dönüştür
        const formatlananYemekler: Yemek[] = data?.map(item => ({
          id: item.id,
          ad: item.yemek_adi,
          kalori: item.kalori,
          porsiyon: item.porsiyon,
          birim: item.birim,
          protein: item.protein || 0,
          karbonhidrat: item.karbonhidrat || 0,
          yag: item.yag || 0,
          tarih: item.tarih || bugunTarih(), // Veritabanında tarih yoksa bugünü kullan
          ogun: item.ogun || 'kahvaltı', // Veritabanında öğün yoksa varsayılan kullan
        })) || [];
        
        // Veritabanından gelen yemekleri state'e ekle
        setYemekler(formatlananYemekler);
        
        // Ayrıca local storage'a da kaydet (opsiyonel)
        kaydetYemekler(formatlananYemekler);
        
      } catch (err) {
        console.error('Kullanıcı yemekleri getirilirken hata:', err);
      }
    };

    useEffect(() => {
      // Local storage'dan yemekleri yükle (geçici olarak)
      const kayitliYemekler = getirYemekler();
      setYemekler(kayitliYemekler);
      
      // Supabase'den kullanıcının yemeklerini çek
      getirKullaniciYemekleri();
      
      // Hazır yemekleri Supabase'den çek
      const getirHazirYemekler = async () => {
        const { data, error } = await supabase
          .from('yemekler')
          .select('*');
        
        if (error) {
          console.error('Hazır yemekler yüklenirken hata:', error);
          return;
        }
        
        setHazirYemekler(data || []);
        
        // Kategori bilgilerini çek
        const { data: kategoriData, error: kategoriError } = await supabase
          .from('yemekler')
          .select('kategori')
          .order('kategori');
        
        if (kategoriError) {
          console.error('Kategoriler yüklenirken hata:', kategoriError);
          return;
        }
        
        if (kategoriData && kategoriData.length > 0) {
          // Benzersiz kategorileri al
          const benzersizKategoriler = [...new Set(kategoriData.map(item => item.kategori))]
            .filter(kategori => kategori && kategori.trim() !== '');
          
          if (benzersizKategoriler.length > 0) {
            setOgunKategorileri(benzersizKategoriler);
          }
        }
      };
      
      getirHazirYemekler();
    }, []);

    // Yemeklerin değişikliği local storage'a kaydedilir
    useEffect(() => {
      kaydetYemekler(yemekler);
    }, [yemekler]);

    const yemekAra = (aramaMetni: string): YemekVeritabani[] => {
      const kucukHarfArama = aramaMetni.toLowerCase().trim();
      return hazirYemekler.filter(yemek => 
        yemek.ad.toLowerCase().includes(kucukHarfArama)
      );
    };

    const yemekEkle = (yeniYemek: Omit<Yemek, 'id'>) => {
      const yemek: Yemek = {
        ...yeniYemek,
        id: rastgeleId()
      };
      setYemekler(oncekiYemekler => [...oncekiYemekler, yemek]);
      
      // Yeni eklenen yemek için Supabase veritabanını güncellemeye gerek yok
      // çünkü YemekEklemeFormu.tsx içinde zaten Supabase'e kaydediyorsunuz
    };

    const yemekGuncelle = (id: string, guncelYemek: Partial<Yemek>) => {
      setYemekler(oncekiYemekler =>
        oncekiYemekler.map(yemek =>
          yemek.id === id ? { ...yemek, ...guncelYemek } : yemek
        )
      );
      
      // Supabase veritabanını da güncelle
      supabase
        .from('kullanici_yemekleri')
        .update({
          yemek_adi: guncelYemek.ad,
          birim: guncelYemek.birim,
          porsiyon: guncelYemek.porsiyon,
          kalori: guncelYemek.kalori,
          protein: guncelYemek.protein,
          karbonhidrat: guncelYemek.karbonhidrat,
          yag: guncelYemek.yag,
          tarih: guncelYemek.tarih,
          kategori: guncelYemek.ogun 
        })
        .eq('id', id)
        .then(({ error }) => {
          if (error) {
            console.error('Yemek güncellenirken hata:', error);
          }
        });
    };

    const yemekSil = (id: string) => {
      setYemekler(oncekiYemekler =>
        oncekiYemekler.filter(yemek => yemek.id !== id)
      );
      
      // Supabase veritabanından da sil
      supabase
        .from('kullanici_yemekleri')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) {
            console.error('Yemek silinirken hata:', error);
          }
        });
    };

    // Tarihe göre yemekleri getir - YENİ FONKSİYON
    const tariheGoreYemekler = (tarih: string) => {
      return yemekler.filter(yemek => yemek.tarih === tarih);
    };

    // Bugünkü yemekleri getir - güncellendi
    const bugunYemekler = () => {
      return tariheGoreYemekler(bugunTarih());
    };

    const bugunToplamKalori = () => {
      return bugunYemekler().reduce((toplam, yemek) => toplam + yemek.kalori, 0);
    };

    const bugunToplamBesinDegerleri = () => {
      const bugunYenenYemekler = bugunYemekler();
      return {
        protein: bugunYenenYemekler.reduce((toplam, yemek) => toplam + (yemek.protein || 0), 0),
        karbonhidrat: bugunYenenYemekler.reduce((toplam, yemek) => toplam + (yemek.karbonhidrat || 0), 0),
        yag: bugunYenenYemekler.reduce((toplam, yemek) => toplam + (yemek.yag || 0), 0)
      };
    };

    const ogunlereGoreYemekler = () => {
      const bugunYenenYemekler = bugunYemekler();
      return {
        'Kahvaltı': bugunYenenYemekler.filter(yemek => yemek.ogun === 'Kahvaltı'),
        'Öğle Yemeği': bugunYenenYemekler.filter(yemek => yemek.ogun === 'Öğle Yemeği'),
        'Akşam Yemeği': bugunYenenYemekler.filter(yemek => yemek.ogun === 'Akşam Yemeği'),
        'Ara Öğün': bugunYenenYemekler.filter(yemek => yemek.ogun === 'Ara Öğün')
      };
    };

    const gunlukOzet = (gun = bugunTarih()) => {
      return hesaplaGunlukOzet(gun, yemekler);
    };

    const sikKullanilanYemekler = () => {
      const yemekFrekansi: Record<string, number> = {};
      
      yemekler.forEach(yemek => {
        const anahtar = yemek.ad.toLowerCase();
        yemekFrekansi[anahtar] = (yemekFrekansi[anahtar] || 0) + 1;
      });
      
      const benzersizYemekler = yemekler.reduce<Record<string, Yemek>>((acc, yemek) => {
        const anahtar = yemek.ad.toLowerCase();
        if (!acc[anahtar]) {
          acc[anahtar] = yemek;
        }
        return acc;
      }, {});
      
      return Object.entries(yemekFrekansi)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([ad]) => benzersizYemekler[ad]);
    };

    // Verileri yeniden yükleme fonksiyonu
    const verileriYenile = async () => {
      console.log('Veriler yenileniyor...');
      try {
        // Önce oturum açmış kullanıcıyı al
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        
        if (!user) {
          console.log('Kullanıcı giriş yapmamış');
          return; // Kullanıcı giriş yapmamışsa çık
        }

        // Kullanıcının yemeklerini çek
        const { data, error } = await supabase
          .from('kullanici_yemekleri')
          .select('*')
          .eq('user_id', user.id);
        
        if (error) {
          console.error('Kullanıcı yemekleri yüklenirken hata:', error);
          return;
        }
        
        // Veritabanından gelen yemekleri Yemek formatına dönüştür
        const formatlananYemekler: Yemek[] = data?.map(item => ({
          id: item.id,
          ad: item.yemek_adi,
          kalori: item.kalori,
          porsiyon: item.porsiyon,
          birim: item.birim,
          protein: item.protein || 0,
          karbonhidrat: item.karbonhidrat || 0,
          yag: item.yag || 0,
          tarih: item.tarih || bugunTarih(), // Veritabanında tarih yoksa bugünü kullan
        ogun: item.kategori || 'Kahvaltı', // kategori sütunundan öğün bilgisini al
        
        })) || [];
        
        // Veritabanından gelen yemekleri state'e ekle
        setYemekler(formatlananYemekler);
        
        // Ayrıca local storage'a da kaydet
        kaydetYemekler(formatlananYemekler);
        
        console.log('Veriler başarıyla yenilendi');
      } catch (err) {
        console.error('Verileri yenilerken hata:', err);
      }
    };

    const deger: YemekBaglamiDegerleri = {
      yemekler,
      hazirYemekler,
      yemekAra,
      yemekEkle,
      yemekGuncelle,
      yemekSil,
      bugunYemekler,
      tariheGoreYemekler,
      bugunToplamKalori,
      bugunToplamBesinDegerleri,
      ogunlereGoreYemekler,
      gunlukOzet,
      sikKullanilanYemekler,
      verileriYenile,
      ogunKategorileri
    };

    return (
      <YemekBaglami.Provider value={deger}>
        {children}
      </YemekBaglami.Provider>
    );
  };

  export const useYemek = () => {
    const baglam = useContext(YemekBaglami);
    if (baglam === undefined) {
      throw new Error('useYemek kancası YemekSaglayici içinde kullanılmalıdır');
    }
    return baglam;
  };
*/


import React, { createContext, useContext, useState, useEffect } from 'react';
import { Yemek, YemekBaglamiDegerleri, YemekVeritabani } from '../tipler';
import { kaydetYemekler, getirYemekler } from '../depolama';
import { bugunTarih, rastgeleId, hesaplaGunlukOzet } from '../yardimcilar';
import { supabase } from '../lib/supabase';

const YemekBaglami = createContext<YemekBaglamiDegerleri | undefined>(undefined);

export const YemekSaglayici: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [yemekler, setYemekler] = useState<Yemek[]>([]);
  const [hazirYemekler, setHazirYemekler] = useState<YemekVeritabani[]>([]);

  const getirKullaniciYemekleri = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      if (!user) {
        console.log('Kullanıcı giriş yapmamış');
        return;
      }

      console.log('🔍 Kullanıcı yemekleri çekiliyor...'); // DEBUG

      const { data, error } = await supabase
        .from('kullanici_yemekleri')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Kullanıcı yemekleri yüklenirken hata:', error);
        return;
      }

      console.log('📦 Veritabanından gelen ham veri:', data); // DEBUG

      const formatlananYemekler: Yemek[] = data?.map(item => {
        const yemek = {
          id: item.id,
          ad: item.yemek_adi,
          kalori: item.kalori,
          porsiyon: item.porsiyon,
          birim: item.birim,
          protein: item.protein || 0,
          karbonhidrat: item.karbonhidrat || 0,
          yag: item.yag || 0,
          tarih: item.tarih || bugunTarih(),
        };
        console.log('✅ Formatlanmış yemek:', yemek); // DEBUG
        return yemek;
      }) || [];

      console.log('🎯 Toplam formatlanmış yemek sayısı:', formatlananYemekler.length); // DEBUG
      console.log('📋 Tüm yemekler:', formatlananYemekler); // DEBUG

      setYemekler(formatlananYemekler);
      kaydetYemekler(formatlananYemekler);
    } catch (err) {
      console.error('Kullanıcı yemekleri getirilirken hata:', err);
    }
  };

  useEffect(() => {
    // Local storage'dan yemekleri yükle (geçici olarak)
    const kayitliYemekler = getirYemekler();
    console.log('💾 Local storage\'dan yüklenen yemekler:', kayitliYemekler); // DEBUG
    setYemekler(kayitliYemekler);
    
    // Supabase'den kullanıcının yemeklerini çek
    getirKullaniciYemekleri();

    const getirHazirYemekler = async () => {
      const { data, error } = await supabase
        .from('yemekler')
        .select('*');

      if (error) {
        console.error('Hazır yemekler yüklenirken hata:', error);
        return;
      }

      setHazirYemekler(data || []);
    };

    getirHazirYemekler();
  }, []);

  useEffect(() => {
    kaydetYemekler(yemekler);
  }, [yemekler]);

  const yemekAra = (aramaMetni: string): YemekVeritabani[] => {
    const kucukHarfArama = aramaMetni.toLowerCase().trim();
    return hazirYemekler.filter(yemek =>
      yemek.ad.toLowerCase().includes(kucukHarfArama)
    );
  };

  const yemekEkle = (yeniYemek: Omit<Yemek, 'id'>) => {
    const yemek: Yemek = {
      ...yeniYemek,
      id: rastgeleId()
    };
    console.log('➕ Yemek ekleniyor:', yemek); // DEBUG
    setYemekler(oncekiYemekler => {
      const yeniListe = [...oncekiYemekler, yemek];
      console.log('📝 Güncellenmiş yemek listesi:', yeniListe); // DEBUG
      return yeniListe;
    });
  };

  const yemekGuncelle = (id: string, guncelYemek: Partial<Yemek>) => {
    setYemekler(oncekiYemekler =>
      oncekiYemekler.map(yemek =>
        yemek.id === id ? { ...yemek, ...guncelYemek } : yemek
      )
    );

    supabase
      .from('kullanici_yemekleri')
      .update({
        yemek_adi: guncelYemek.ad,
        birim: guncelYemek.birim,
        porsiyon: guncelYemek.porsiyon,
        kalori: guncelYemek.kalori,
        protein: guncelYemek.protein,
        karbonhidrat: guncelYemek.karbonhidrat,
        yag: guncelYemek.yag,
        tarih: guncelYemek.tarih,
      })
      .eq('id', id)
      .then(({ error }) => {
        if (error) {
          console.error('Yemek güncellenirken hata:', error);
        }
      });
  };

  const yemekSil = (id: string) => {
    setYemekler(oncekiYemekler =>
      oncekiYemekler.filter(yemek => yemek.id !== id)
    );

    supabase
      .from('kullanici_yemekleri')
      .delete()
      .eq('id', id)
      .then(({ error }) => {
        if (error) {
          console.error('Yemek silinirken hata:', error);
        }
      });
  };

  const tariheGoreYemekler = (tarih: string) => {
    const sonuc = yemekler.filter(yemek => yemek.tarih === tarih);
    console.log(`📅 ${tarih} tarihindeki yemekler:`, sonuc); // DEBUG
    return sonuc;
  };

  const bugunYemekler = () => {
    const bugun = bugunTarih();
    const bugunYenenler = tariheGoreYemekler(bugun);
    console.log(`🍽️ Bugün (${bugun}) yenen yemekler:`, bugunYenenler); // DEBUG
    return bugunYenenler;
  };

  const bugunToplamKalori = () => {
    const toplam = bugunYemekler().reduce((toplam, yemek) => toplam + yemek.kalori, 0);
    console.log('🔥 Bugün toplam kalori:', toplam); // DEBUG
    return toplam;
  };

  const bugunToplamBesinDegerleri = () => {
    const bugunYenenYemekler = bugunYemekler();
    return {
      protein: bugunYenenYemekler.reduce((toplam, yemek) => toplam + (yemek.protein || 0), 0),
      karbonhidrat: bugunYenenYemekler.reduce((toplam, yemek) => toplam + (yemek.karbonhidrat || 0), 0),
      yag: bugunYenenYemekler.reduce((toplam, yemek) => toplam + (yemek.yag || 0), 0)
    };
  };

  // Öğün sistemi kaldırıldı - basit yemek listesi döndür
  const ogunlereGoreYemekler = () => {
    const bugunYenenYemekler = bugunYemekler();
    console.log('🍴 Öğünlere göre yemekler çağrıldı, bugün yenen yemekler:', bugunYenenYemekler); // DEBUG
    return {
      'Tüm Yemekler': bugunYenenYemekler
    };
  };

  const gunlukOzet = (gun = bugunTarih()) => {
    return hesaplaGunlukOzet(gun, yemekler);
  };

  const sikKullanilanYemekler = () => {
    const yemekFrekansi: Record<string, number> = {};

    yemekler.forEach(yemek => {
      const anahtar = yemek.ad.toLowerCase();
      yemekFrekansi[anahtar] = (yemekFrekansi[anahtar] || 0) + 1;
    });

    const benzersizYemekler = yemekler.reduce<Record<string, Yemek>>((acc, yemek) => {
      const anahtar = yemek.ad.toLowerCase();
      if (!acc[anahtar]) {
        acc[anahtar] = yemek;
      }
      return acc;
    }, {});

    return Object.entries(yemekFrekansi)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([ad]) => benzersizYemekler[ad]);
  };

  const verileriYenile = async () => {
    console.log('🔄 Veriler yenileniyor...');
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      if (!user) {
        console.log('Kullanıcı giriş yapmamış');
        return;
      }

      const { data, error } = await supabase
        .from('kullanici_yemekleri')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Kullanıcı yemekleri yüklenirken hata:', error);
        return;
      }

      console.log('🔄 Yenileme - Veritabanından gelen veri:', data); // DEBUG

      const formatlananYemekler: Yemek[] = data?.map(item => ({
        id: item.id,
        ad: item.yemek_adi,
        kalori: item.kalori,
        porsiyon: item.porsiyon,
        birim: item.birim,
        protein: item.protein || 0,
        karbonhidrat: item.karbonhidrat || 0,
        yag: item.yag || 0,
        tarih: item.tarih || bugunTarih()
      })) || [];

      console.log('🔄 Yenileme - Formatlanmış yemekler:', formatlananYemekler); // DEBUG

      setYemekler(formatlananYemekler);
      kaydetYemekler(formatlananYemekler);
      console.log('✅ Veriler başarıyla yenilendi');
    } catch (err) {
      console.error('Verileri yenilerken hata:', err);
    }
  };

  const deger: YemekBaglamiDegerleri = {
    yemekler,
    hazirYemekler,
    yemekAra,
    yemekEkle,
    yemekGuncelle,
    yemekSil,
    bugunYemekler,
    tariheGoreYemekler,
    bugunToplamKalori,
    bugunToplamBesinDegerleri,
    ogunlereGoreYemekler,
    gunlukOzet,
    sikKullanilanYemekler,
    verileriYenile,
  };

  return (
    <YemekBaglami.Provider value={deger}>
      {children}
    </YemekBaglami.Provider>
  );
};

export const useYemek = () => {
  const baglam = useContext(YemekBaglami);
  if (baglam === undefined) {
    throw new Error('useYemek kancası YemekSaglayici içinde kullanılmalıdır');
  }
  return baglam;
};