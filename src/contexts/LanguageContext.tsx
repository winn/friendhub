import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'th';

interface Translations {
  [key: string]: {
    en: string;
    th: string;
  };
}

const translations: Translations = {
  // Auth
  signin: {
    en: 'Sign In',
    th: 'เข้าสู่ระบบ'
  },
  signup: {
    en: 'Join Now!',
    th: 'สมัครสมาชิก!'
  },
  signout: {
    en: 'Sign Out',
    th: 'ออกจากระบบ'
  },
  join_fun: {
    en: 'Join the Fun! 🎉',
    th: 'มาสนุกด้วยกัน! 🎉'
  },
  join_message: {
    en: 'Create an account to chat with awesome AI friends!',
    th: 'สร้างบัญชีเพื่อแชทกับเพื่อน AI สุดเจ๋ง!'
  },
  email: {
    en: 'Email',
    th: 'อีเมล'
  },
  password: {
    en: 'Password',
    th: 'รหัสผ่าน'
  },
  name: {
    en: 'Name (optional)',
    th: 'ชื่อ (ไม่บังคับ)'
  },
  continue_with_google: {
    en: 'Continue with Google',
    th: 'เข้าสู่ระบบด้วย Google'
  },
  or_continue_with_email: {
    en: 'Or continue with email',
    th: 'หรือเข้าสู่ระบบด้วยอีเมล'
  },
  already_have_account: {
    en: 'Already have an account?',
    th: 'มีบัญชีอยู่แล้ว?'
  },
  dont_have_account: {
    en: "Don't have an account?",
    th: 'ยังไม่มีบัญชี?'
  },
  create_account: {
    en: 'Create Account',
    th: 'สร้างบัญชี'
  },
  verification_sent: {
    en: 'Almost there! ✨',
    th: 'เกือบเสร็จแล้ว! ✨'
  },
  check_email: {
    en: "We've sent a verification link to your email. Please check your email and click the link to activate your account.",
    th: 'เราได้ส่งลิงก์ยืนยันไปที่อีเมลของคุณแล้ว กรุณาตรวจสอบอีเมลและคลิกลิงก์เพื่อเปิดใช้งานบัญชีของคุณ'
  },
  got_it: {
    en: 'Got it!',
    th: 'เข้าใจแล้ว!'
  },
  what_should_we_call_you: {
    en: 'What should we call you?',
    th: 'คุณอยากให้เราเรียกคุณว่าอะไร?'
  },
  welcome_back: {
    en: 'Welcome Back! ✨',
    th: 'ยินดีต้อนรับกลับ! ✨'
  },
  email_exists: {
    en: 'This email is already registered. Please sign in instead.',
    th: 'อีเมลนี้ถูกลงทะเบียนแล้ว กรุณาเข้าสู่ระบบแทน'
  },
  invalid_credentials: {
    en: 'Invalid email or password',
    th: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
  },

  // Points and Store
  points: {
    en: 'Points',
    th: 'พอยท์'
  },
  power_points: {
    en: 'Power Points',
    th: 'พอยท์พลัง'
  },
  get_points: {
    en: 'Get More Points!',
    th: 'รับพอยท์เพิ่ม!'
  },
  points_description: {
    en: 'Get points to chat more! The more you chat, the more fun you have! 🌟',
    th: 'รับพอยท์เพื่อแชทให้มากขึ้น! ยิ่งแชท ยิ่งสนุก! 🌟'
  },
  starter_pack: {
    en: 'Starter Pack',
    th: 'แพ็คเริ่มต้น'
  },
  power_pack: {
    en: 'Power Pack',
    th: 'แพ็คพลัง'
  },
  premium_pack: {
    en: 'Premium Pack',
    th: 'แพ็คพรีเมียม'
  },
  perfect_for_starting: {
    en: 'Perfect for getting started!',
    th: 'เหมาะสำหรับผู้เริ่มต้น!'
  },
  best_value: {
    en: 'Best value for power users!',
    th: 'คุ้มค่าที่สุดสำหรับผู้ใช้งานจริงจัง!'
  },
  most_popular: {
    en: 'Most Popular ⭐',
    th: 'นิยมที่สุด ⭐'
  },
  purchase_now: {
    en: 'Purchase Now',
    th: 'ซื้อเลย'
  },
  secure_payment_stripe: {
    en: 'Secure payments powered by Stripe',
    th: 'ชำระเงินปลอดภัยด้วย Stripe'
  },

  // Friends/Agents
  my_ai_squad: {
    en: 'My AI Squad',
    th: 'ทีม AI ของฉัน'
  },
  squad_description: {
    en: 'Create and manage your own AI friends! Make them unique and awesome! ✨',
    th: 'สร้างและจัดการเพื่อน AI ของคุณ! ทำให้พวกเขาเป็นเอกลักษณ์และน่าทึ่ง! ✨'
  },
  create_friend: {
    en: 'Create New Friend',
    th: 'สร้างเพื่อนใหม่'
  },
  create_description: {
    en: 'Design your perfect AI buddy! Give them a cool personality! 🎨',
    th: 'ออกแบบเพื่อน AI ในแบบของคุณ! ให้พวกเขามีบุคลิกที่เท่และเป็นเอกลักษณ์! 🎨'
  },
  edit_friend: {
    en: 'Edit AI Friend',
    th: 'แก้ไขเพื่อน AI'
  },
  view_squad: {
    en: 'View My Squad',
    th: 'ดูทีมของฉัน'
  },
  available_friends: {
    en: 'Available Friends',
    th: 'เพื่อนที่พร้อมแชท'
  },
  no_friends_yet: {
    en: 'No AI Friends Yet! 🚀',
    th: 'ยังไม่มีเพื่อน AI! 🚀'
  },
  create_first_friend: {
    en: 'Time to create your first awesome AI friend!',
    th: 'ถึงเวลาสร้างเพื่อน AI สุดเจ๋งคนแรกของคุณ!'
  },
  friend_name: {
    en: "Friend's Name",
    th: 'ชื่อเพื่อน'
  },
  enter_friend_name: {
    en: "Enter your friend's name",
    th: 'ใส่ชื่อเพื่อนของคุณ'
  },
  avatar_url: {
    en: 'Avatar URL',
    th: 'URL รูปโปรไฟล์'
  },
  paste_image_url: {
    en: 'Paste a picture URL here',
    th: 'วาง URL รูปภาพที่นี่'
  },
  personality: {
    en: 'Personality',
    th: 'บุคลิกภาพ'
  },
  personality_placeholder: {
    en: 'Describe your friend\'s personality...',
    th: 'อธิบายบุคลิกภาพของเพื่อนคุณ...'
  },
  instructions: {
    en: 'Instructions',
    th: 'คำแนะนำ'
  },
  instructions_placeholder: {
    en: 'What should your friend do or not do?',
    th: 'เพื่อนของคุณควรทำหรือไม่ควรทำอะไร?'
  },
  prohibitions: {
    en: 'Prohibitions',
    th: 'ข้อห้าม'
  },
  prohibitions_placeholder: {
    en: 'What topics should your friend avoid?',
    th: 'หัวข้อใดที่เพื่อนของคุณควรหลีกเลี่ยง?'
  },

  // Chat
  chat_now: {
    en: 'Chat Now!',
    th: 'แชทเลย!'
  },
  type_message: {
    en: 'Type something fun...',
    th: 'พิมพ์อะไรสนุกๆ...'
  },
  agent: {
    en: 'Agent',
    th: 'เอเจนต์'
  },
  rate_friend: {
    en: 'Rate',
    th: 'ให้คะแนน'
  },
  back: {
    en: 'Back',
    th: 'กลับ'
  },

  // Marketplace
  marketplace_title: {
    en: 'Available Friends ✨',
    th: 'เพื่อนที่พร้อมแชท ✨'
  },
  marketplace_subtitle: {
    en: 'Find your perfect AI companion!',
    th: 'ค้นหาเพื่อน AI ที่ใช่สำหรับคุณ!'
  },
  search: {
    en: 'Search AI friends...',
    th: 'ค้นหาเพื่อน AI...'
  },
  showing: {
    en: 'Showing',
    th: 'แสดง'
  },
  in: {
    en: 'in',
    th: 'ใน'
  },
  matching: {
    en: 'matching',
    th: 'ที่ตรงกับ'
  },
  ready_to_chat: {
    en: 'Ready to be your friend! ✨',
    th: 'พร้อมเป็นเพื่อนคุณ! ✨'
  },

  // Reviews
  reviews: {
    en: 'Reviews',
    th: 'รีวิว'
  },
  write_review: {
    en: 'Your Review (Optional)',
    th: 'เขียนรีวิว (ไม่บังคับ)'
  },
  share_experience: {
    en: 'Share your experience...',
    th: 'แชร์ประสบการณ์ของคุณ...'
  },
  submit_rating: {
    en: 'Submit Rating',
    th: 'ส่งคะแนน'
  },
  select_rating: {
    en: 'Please select a rating',
    th: 'กรุณาเลือกคะแนน'
  },
  you_rated: {
    en: 'You rated',
    th: 'คุณให้คะแนน'
  },
  stars: {
    en: 'stars',
    th: 'ดาว'
  },
  no_reviews: {
    en: 'No reviews yet',
    th: 'ยังไม่มีรีวิว'
  },

  // General
  loading: {
    en: 'Loading',
    th: 'กำลังโหลด'
  },
  error: {
    en: 'An error occurred',
    th: 'เกิดข้อผิดพลาด'
  },
  error_message: {
    en: 'Failed to send message. Please try again.',
    th: 'ส่งข้อความไม่สำเร็จ กรุณาลองใหม่'
  },
  cancel: {
    en: 'Cancel',
    th: 'ยกเลิก'
  },
  delete: {
    en: 'Delete',
    th: 'ลบ'
  },
  deleting: {
    en: 'Deleting...',
    th: 'กำลังลบ...'
  },
  confirm_delete: {
    en: 'This action cannot be undone. Are you sure?',
    th: 'การกระทำนี้ไม่สามารถยกเลิกได้ คุณแน่ใจหรือไม่?'
  },
  save_changes: {
    en: 'Save Changes',
    th: 'บันทึกการเปลี่ยนแปลง'
  },
  updating: {
    en: 'Updating...',
    th: 'กำลังอัปเดต...'
  },
  friend_updated: {
    en: 'Your friend has been updated! ✨',
    th: 'อัปเดตเพื่อนของคุณเรียบร้อยแล้ว! ✨'
  },
  friend_created: {
    en: 'Your new friend is ready! ✨',
    th: 'เพื่อนใหม่ของคุณพร้อมแล้ว! ✨'
  },
  get_started: {
    en: 'Get Started!',
    th: 'เริ่มต้นใช้งาน!'
  },
  privacy_policy: {
    en: 'Privacy Policy',
    th: 'นโยบายความเป็นส่วนตัว'
  },
  terms_of_service: {
    en: 'Terms of Service',
    th: 'ข้อกำหนดการใช้งาน'
  },
  hero_title: {
    en: 'Your AI Friends Await! ✨',
    th: 'เพื่อน AI รอคุณอยู่! ✨'
  },
  hero_subtitle: {
    en: 'Chat, create, and connect with unique AI personalities',
    th: 'แชท สร้าง และเชื่อมต่อกับ AI ที่มีเอกลักษณ์เฉพาะตัว'
  },

  // Channel Settings
  channel_settings: {
    en: 'Channel Settings',
    th: 'ตั้งค่าช่องทาง'
  },
  copy_url: {
    en: 'Copy URL',
    th: 'คัดลอก URL'
  },
  copied: {
    en: 'Copied!',
    th: 'คัดลอกแล้ว!'
  },
  webhook_instructions: {
    en: 'Use this webhook URL in your LINE Messaging API settings',
    th: 'ใช้ URL webhook นี้ในการตั้งค่า LINE Messaging API'
  },
  line_access_token: {
    en: 'LINE Channel Access Token',
    th: 'โทเค็นการเข้าถึงช่อง LINE'
  },
  enter_access_token: {
    en: 'Enter your LINE channel access token',
    th: 'ใส่โทเค็นการเข้าถึงช่อง LINE'
  },
  line_secret_token: {
    en: 'LINE Channel Secret Token',
    th: 'โทเค็นความลับช่อง LINE'
  },
  enter_secret_token: {
    en: 'Enter your LINE channel secret token',
    th: 'ใส่โทเค็นความลับช่อง LINE'
  },
  error_fetch_config: {
    en: 'Failed to fetch channel configuration',
    th: 'ไม่สามารถดึงการตั้งค่าช่องทางได้'
  },
  error_update_config: {
    en: 'Failed to update channel configuration',
    th: 'ไม่สามารถอัปเดตการตั้งค่าช่องทางได้'
  },
  error_update_agent: {
    en: 'Failed to update agent',
    th: 'ไม่สามารถอัปเดตเอเจนต์ได้'
  },
  add_avatar: {
    en: 'Add a picture!',
    th: 'เพิ่มรูปภาพ!'
  },
  avatar: {
    en: 'Avatar',
    th: 'รูปโปรไฟล์'
  },
  image_error: {
    en: 'Failed to load image. Please check the URL.',
    th: 'ไม่สามารถโหลดรูปภาพได้ กรุณาตรวจสอบ URL'
  },
  processing: {
    en: 'Processing...',
    th: 'กำลังดำเนินการ...'
  },
  creating: {
    en: 'Creating...',
    th: 'กำลังสร้าง...'
  },
  main_category: {
    en: 'Main Category',
    th: 'หมวดหมู่หลัก'
  },
  sub_category: {
    en: 'Sub Category',
    th: 'หมวดหมู่ย่อย'
  },
  select_category: {
    en: 'Select category',
    th: 'เลือกหมวดหมู่'
  },
  select_subcategory: {
    en: 'Select subcategory',
    th: 'เลือกหมวดหมู่ย่อย'
  },
  rate_chat: {
    en: 'Rate your chat with',
    th: 'ให้คะแนนการแชทกับ'
  },
  user: {
    en: 'User',
    th: 'ผู้ใช้'
  },
  most_popular: {
    en: 'Most Popular',
    th: 'ยอดนิยม'
  },
  highest_rated: {
    en: 'Highest Rated',
    th: 'คะแนนสูงสุด'
  },
  newest_first: {
    en: 'Newest First',
    th: 'ใหม่ล่าสุด'
  },
  most_active: {
    en: 'Most Active',
    th: 'ใช้งานมากที่สุด'
  },
  no_results: {
    en: 'No AI Friends Found',
    th: 'ไม่พบเพื่อน AI'
  },
  try_different_search: {
    en: 'Try adjusting your filters or search terms to find more friends!',
    th: 'ลองปรับตัวกรองหรือคำค้นหาเพื่อค้นหาเพื่อนเพิ่มเติม!'
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key
});

export function useLanguage() {
  return useContext(LanguageContext);
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved === 'th' || saved === 'en') ? saved : 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key: string): string => {
    if (!translations[key]) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
    return translations[key][language];
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}