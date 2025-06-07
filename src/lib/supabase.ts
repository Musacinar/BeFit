import { createClient } from '@supabase/supabase-js';


const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


export const signUp = async (email: string, password: string) => {
  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error || !authData?.user) {
    return { error };
  }

  const userId = authData.user.id;

  // Profil tablosuna veri ekleme
  const { error: insertError } = await supabase.from('profiles').insert({
    user_id: userId,
    // Buraya profil bilgileri ekleyebilirsin
    // Örnek: name: '', age: null, gender: '', etc.
  });

  if (insertError) {
    console.error('Profil eklenemedi:', insertError.message);
    return { error: insertError };
  }

  return { error: null };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};


// lib/supabase.js dosyasına eklenecek fonksiyon

export const sifreSifirla = async (email) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/sifre-sifirla`,
    });
    
    if (error) {
      throw error;
    }
    
    return { success: true, message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.' };
  } catch (error) {
    console.error('Şifre sıfırlama hatası:', error);
    
    // Türkçe hata mesajları
    let mesaj = 'Bir hata oluştu. Lütfen tekrar deneyin.';
    
    if (error.message.includes('Email not confirmed')) {
      mesaj = 'E-posta adresiniz doğrulanmamış. Lütfen e-postanızı kontrol edin.';
    } else if (error.message.includes('Invalid email')) {
      mesaj = 'Geçersiz e-posta adresi.';
    } else if (error.message.includes('User not found')) {
      mesaj = 'Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı.';
    }
    
    return { success: false, message: mesaj };
  }
  
};