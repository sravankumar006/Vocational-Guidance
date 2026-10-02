import React, { createContext, useContext, useState } from 'react';
import { Language } from '@/types';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const DICTIONARY: Record<Language, Record<string, string>> = {
  en: {
    // App & Identity
    appName: 'Margadarshak',
    platformName: 'Vocational Guidance Platform',
    platformTagline: 'Empirical Career Pathways & Family Decision Support',
    govInitiative: 'Skill Development & Vocational Education Initiative',
    
    // Auth & Roles
    login: 'Log In',
    logout: 'Log Out',
    studentRole: 'Student',
    parentRole: 'Parent / Guardian',
    adminRole: 'Administrator',
    familyContext: 'Family Unit',
    unauthorizedTitle: 'Access Restricted',
    unauthorizedDesc: 'You do not have permission to view this section with your current role.',
    backToLogin: 'Back to Login',
    goToDashboard: 'Go to Your Dashboard',
    
    // Navigation
    navHome: 'Home',
    navProfile: 'My Profile',
    navCareer: 'Career Exploration',
    navCounselling: 'Counselling',
    navCareerPath: 'Career Pathways',
    navFamily: 'Family Harmony',
    navHelp: 'Help & FAQs',
    navConcerns: 'Family Concerns',
    navAnalytics: 'Analytics',
    navData: 'Data Management',
    navEscalations: 'Human Escalations',
    
    // Parent Portal High-Clarity Actions
    parentQuestion: 'What is my child planning to do?',
    parentChildSummary: 'Review career plans, verified salary benchmarks, and safe progression pathways.',
    parentVoiceAction: 'Tap to Speak in Telugu or English',
    parentVoiceSubtext: 'Ask about job safety, salary, or college progression without typing',
    parentSalaryConcern: 'Is this job stable and what is the salary?',
    parentSafetyConcern: 'Is the working environment safe for my child?',
    parentProgressionConcern: 'Can my child pursue a higher degree later?',
    parentTalkCounsellor: 'Speak with Family Counsellor',
    
    // Student Actions
    studentWelcome: 'Welcome back',
    studentActivePathway: 'Active Vocational Pathway',
    exploreTrades: 'Explore Verified Trades',
    benchmarkNotice: 'Backed by 10,000+ empirical vocational records',
    
    // Admin
    adminTitle: 'Platform Administration & Oversight',
    systemMetrics: 'System Metrics',
    verifiedRecords: 'Verified Vocational Records',
    activeProviders: 'Training Providers',
    pendingEscalations: 'Pending Human Escalations',
    
    // Common Actions
    viewDetails: 'View Details',
    submit: 'Submit',
    cancel: 'Cancel',
    save: 'Save',
    search: 'Search...',
    filter: 'Filter',
    loading: 'Loading...',
    verifiedBadge: 'Verified Benchmark',
  },
  te: {
    // App & Identity
    appName: 'మార్గదర్శక్',
    platformName: 'వృత్తి విద్యా మార్గదర్శక వేదిక',
    platformTagline: 'ధృవీకరించబడిన వృత్తి మార్గాలు & కుటుంబ నిర్ణయ మద్దతు',
    govInitiative: 'నైపుణ్యాభివృద్ధి & వృత్తి విద్యా ప్రోత్సాహకం',
    
    // Auth & Roles
    login: 'లాగిన్ చేయండి',
    logout: 'లాగౌట్',
    studentRole: 'విద్యార్థి',
    parentRole: 'తల్లిదండ్రులు / సంరక్షకులు',
    adminRole: 'నిర్వాహకుడు',
    familyContext: 'కుటుంబ విభాగం',
    unauthorizedTitle: 'ప్రాప్యత పరిమితం చేయబడింది',
    unauthorizedDesc: 'మీ ప్రస్తుత పాత్రతో ఈ విభాగాన్ని వీక్షించడానికి మీకు అనుమతి లేదు.',
    backToLogin: 'లాగిన్‌కు తిరిగి వెళ్లండి',
    goToDashboard: 'మీ డ్యాష్‌బోర్డ్‌కు వెళ్లండి',
    
    // Navigation
    navHome: 'హోమ్',
    navProfile: 'నా ప్రొఫైల్',
    navCareer: 'వృత్తి అన్వేషణ',
    navCounselling: 'కౌన్సెలింగ్',
    navCareerPath: 'కెరీర్ మార్గాలు',
    navFamily: 'కుటుంబ సమన్వయం',
    navHelp: 'సహాయం',
    navConcerns: 'కుటుంబ సందేహాలు',
    navAnalytics: 'గణాంకాలు',
    navData: 'డేటా నిర్వహణ',
    navEscalations: 'కౌన్సెలర్ సంప్రదింపులు',
    
    // Parent Portal High-Clarity Actions
    parentQuestion: 'నా బిడ్డ ఏమి చేయాలనుకుంటున్నారు?',
    parentChildSummary: 'కెరీర్ ప్రణాళికలు, జీతం వివరాలు మరియు భవిష్యత్తు మార్గాలను పరిశీలించండి.',
    parentVoiceAction: 'తెలుగు లేదా ఇంగ్లీషులో మాట్లాడటానికి నొక్కండి',
    parentVoiceSubtext: 'టైప్ చేయకుండానే ఉద్యోగ భద్రత, జీతం లేదా ఉన్నత చదువుల గురించి అడగండి',
    parentSalaryConcern: 'ఈ ఉద్యోగం స్థిరమైనదేనా మరియు ఎంత జీతం వస్తుంది?',
    parentSafetyConcern: 'పని వాతావరణం నా బిడ్డకు సురక్షితమైనదేనా?',
    parentProgressionConcern: 'నా బిడ్డ తర్వాత డిగ్రీ లేదా ఉన్నత చదువులు చదవవచ్చా?',
    parentTalkCounsellor: 'కుటుంబ కౌన్సెలర్‌తో మాట్లాడండి',
    
    // Student Actions
    studentWelcome: 'స్వాగతం',
    studentActivePathway: 'ఎంచుకున్న వృత్తి మార్గం',
    exploreTrades: 'ధృవీకరించబడిన కోర్సులను చూడండి',
    benchmarkNotice: '10,000+ నిజమైన రికార్డుల ఆధారంగా నిర్ధారించబడింది',
    
    // Admin
    adminTitle: 'ప్లాట్‌ఫారమ్ అడ్మినిస్ట్రేషన్',
    systemMetrics: 'వ్యవస్థ గణాంకాలు',
    verifiedRecords: 'ధృవీకరించబడిన రికార్డులు',
    activeProviders: 'శిక్షణా సంస్థలు',
    pendingEscalations: 'పరిష్కరించాల్సిన సంప్రదింపులు',
    
    // Common Actions
    viewDetails: 'వివరాలు చూడండి',
    submit: 'సమర్పించండి',
    cancel: 'రద్దు చేయండి',
    save: 'భద్రపరచు',
    search: 'వెతకండి...',
    filter: 'వడపోత',
    loading: 'లోడ్ అవుతోంది...',
    verifiedBadge: 'ధృవీకరించబడిన సమాచారం',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('sih_language') as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('sih_language', lang);
  };

  const t = (key: string): string => {
    return DICTIONARY[language]?.[key] || DICTIONARY['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
