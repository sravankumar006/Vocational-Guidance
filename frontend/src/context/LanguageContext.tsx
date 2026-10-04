import React, { createContext, useContext, useState } from 'react';
import { Language } from '@/types';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  localizeName: (name?: string | null) => string;
  localizeCareerTitle: (title?: string | null) => string;
  localizeEducation: (edu?: string | null) => string;
  localizeLocation: (loc?: string | null) => string;
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
    switchToStudent: 'Switch to Student View',
    switchToParent: 'Switch to Parent View',
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
    
    // Parent Portal High-Clarity Actions & Dashboard
    yourChild: 'Your Child',
    careerNotSelected: 'Career not selected yet',
    whatWouldYouLikeToKnow: 'What would you like to know?',
    parentQuestionSubtitle: 'Select any question below to explore factual, verified information with the AI counsellor.',
    parentQuestion: 'What is my child planning to do?',
    parentChildSummary: 'Review career plans, verified salary benchmarks, and safe progression pathways.',
    parentVoiceAction: 'Tap to Speak in Telugu or English',
    parentVoiceSubtext: 'Ask about job safety, salary, or college progression without typing',
    parentSalaryConcern: 'Is this job stable and what is the salary?',
    parentSafetyConcern: 'Is the working environment safe for my child?',
    parentProgressionConcern: 'Can my child pursue a higher degree later?',
    parentTalkCounsellor: 'Speak with Family Counsellor',

    // Human Escalation (Brick 31)
    escalationPromptTitle: 'Need More Guidance?',
    escalationPromptSubtitle: 'Sometimes a question is easier to discuss with a person. A counsellor can help you understand options.',
    escalationModalTitle: 'Talk to a Human Counsellor',
    escalationModalDesc: "A certified vocational counsellor will review your questions, child context, and career options to guide you personally.",
    escalationConcernLabel: 'What is your primary concern?',
    escalationNotesPlaceholder: 'Briefly mention what you would like to discuss (optional)...',
    escalationConfirmAction: 'Confirm & Send Request',
    escalationCancelAction: 'Cancel',
    escalationSending: 'Sending Request...',
    escalationSentSuccess: 'Your request has been sent.',
    escalationSentSubtext: 'A human counsellor will review your concern and reach out.',
    escalationStatusPending: 'Pending Review',
    escalationStatusInProgress: 'In Progress with Counsellor',
    escalationStatusResolved: 'Resolved',
    escalationActiveBanner: 'Your counselling request is currently being handled by a human counsellor.',
    escalationResolvedNotice: 'Your previous counselling request was resolved. You can submit a new request if you have another concern.',
    
    // Parent 6 Core Question Cards
    cardIncomeTitle: 'Income',
    cardIncomeDesc: 'Understand available salary information',
    cardIncomeQuestion: 'What income information is available for this career?',
    
    cardJobSecurityTitle: 'Job Security',
    cardJobSecurityDesc: 'Explore employment and job availability information',
    cardJobSecurityQuestion: 'What job availability information is available for this career?',
    
    cardFurtherEducationTitle: 'Further Education',
    cardFurtherEducationDesc: 'See possible education and training pathways',
    cardFurtherEducationQuestion: 'What further education options are available after this career?',
    
    cardCareerGrowthTitle: 'Career Growth',
    cardCareerGrowthDesc: 'Explore career progression',
    cardCareerGrowthQuestion: 'What does the career progression look like?',
    
    cardWorkNearHomeTitle: 'Work Near Home',
    cardWorkNearHomeDesc: 'Explore opportunities related to the preferred location',
    cardWorkNearHomeQuestion: "What information is available about opportunities near my child's preferred location?",
    
    cardTalkToAiTitle: 'Talk to AI',
    cardTalkToAiDesc: "Ask a question about your child's career",
    
    // Parent Empty & Error States
    parentNoStudentLinkedTitle: 'No student profile is linked to your account yet.',
    parentNoStudentLinkedDesc: "Once your child's student profile is linked to your family account, you will be able to review their vocational choices, training paths, and ask questions.",
    parentLoadingChild: "Loading your child's information...",
    parentLoadingSubtext: 'Connecting securely to verified family records',
    parentErrorTitle: "We couldn't load your child's information. Please try again.",
    parentErrorSubtext: 'Our servers could not retrieve the linked profile right now.',
    tryAgain: 'Try Again',

    // Parent Counselling Header & Starters
    parentCounsellorTitle: 'Parent Vocational Guidance Counsellor',
    parentCounsellorSubtitle: 'Authorized family decision support grounded in verified statutory records',
    familyContextProtected: 'Family Context Protected',
    parentGuidanceMode: 'Parent Guidance Mode',
    parentExplainNotice: 'You asked me to explain:',
    parentFocus: 'Focus:',
    vocationalGuidanceForParents: 'Vocational Guidance for Parents & Families',
    parentIntroPrompt: "Ask questions regarding your child's training options, trade career security, starting salary benchmarks, or workshop safety standards.",
    qJobSecurityTitle: 'Job Security & Wages',
    qJobSecurityPrompt: 'What is the job stability and starting wage range for certified ITI technicians?',
    qVocationalVsDegreeTitle: 'Vocational vs Degree',
    qVocationalVsDegreePrompt: 'How does an NSQF Level 4 vocational qualification compare with a general university degree?',
    qWorkshopSafetyTitle: 'Workshop Safety',
    qWorkshopSafetyPrompt: 'What safety standards and training environments are maintained in government ITIs?',
    qFurtherStudyTitle: 'Further Study Options',
    qFurtherStudyPrompt: 'Can my child pursue an engineering Polytechnic Diploma or Degree after ITI certification?',

    // Brick 29: Parent AI Counselling & Voice Controls
    parentYou: 'You (Parent)',
    studentYou: 'You (Student)',
    vocationalCounsellor: 'Vocational Counsellor',
    listenToAnswer: 'Listen',
    stopListening: 'Stop',
    ttsUnavailable: 'Voice playback is currently unavailable in this browser.',
    notFullySureNotice: "I don't have enough verified information to answer that with full confidence.",
    talkToHumanCounsellor: 'Talk to a Human Counsellor',
    humanReviewAdvised: 'Human counsellor review advised',
    statutoryRecordsSupported: 'Well supported by verified statutory records',
    generalGuidanceNotice: 'General guidance',
    limitedDataNotice: 'Limited verified data available',
    askByVoice: 'Ask your question by voice',
    voiceHelpText: 'Tap the microphone and ask naturally in Telugu or English',
    thinkingCounsellor: 'Thinking...',
    preparingAnswer: 'Preparing your answer...',
    voicePromptBannerTitle: '🎙️ Ask your question by voice',
    voicePromptBannerSubtitle: 'You do not need to type. Tap Speak, ask naturally, and listen to the verified answer.',
    speakNaturallySamples: 'Examples: "Can my child get a job after this course?" • "How much can they earn?" • "Can they work near our village?"',

    // Brick 30: Voice Counselling (STT & TTS States & Messages)
    voiceIdleBtn: 'Tap to speak',
    voiceListeningBtn: 'Listening... Speak now',
    voiceProcessing: 'Thinking...',
    voiceSpeaking: 'Speaking answer...',
    stopSpeech: 'Stop',
    youSaid: 'You said:',
    sendQuestion: 'Send',
    speakAgain: 'Speak Again',
    tryAgainVoice: 'Try Again',
    sttFailedMessage: "We couldn't understand that. Please try speaking again.",
    ttsFailedMessage: "Your answer is ready. Voice playback isn't available right now. You can still read the answer below.",
    talkToHumanCounsellorVoice: 'Would you like to talk to a human counsellor?',
    voiceQuestionHelp: 'Ask any question about jobs, salary, training, or safety.',

    // Brick 28: Parent Concerns (Very Simple Words + Low-Literacy Support)
    whatAreYouWorriedAbout: 'What are you worried about?',
    concernsSubtext: 'Select what worries you the most. We will give you simple, honest facts.',
    talkToPerson: 'Talk to a Person',
    talkToPersonDesc: 'Need to speak directly with a human guidance counsellor?',
    backToDashboard: 'Back to Dashboard',
    tellUsConcernVoice: 'Tell us your concern',
    speakNow: 'Listening... Speak your question now',
    tapToSpeak: 'Tap microphone to speak instead of reading or typing',
    readAloud: 'Listen to this concern',
    playingAudio: 'Reading aloud...',
    otherConcernModalTitle: 'Tell us your question',
    otherConcernModalSubtitle: 'Type what you are worried about, or speak using the microphone.',
    typeOrSpeakPlaceholder: 'For example: Will my child get a hostel? Can she work locally?',
    continueToCounsellor: 'Ask Counsellor',
    savingConcern: 'Connecting to Counsellor...',
    humanEscalationConfirmation: 'We are connecting you with a human vocational guidance specialist.',

    // 8 Exact Parent Concern Cards (English)
    concernIncomeTitle: 'Income',
    concernIncomeSubtitle: 'Can my child earn enough?',
    concernIncomeQuestion: 'How much can my child earn in this career? What is the starting wage?',

    concernJobSecurityTitle: 'Job',
    concernJobSecuritySubtitle: 'Can my child get a job?',
    concernJobSecurityQuestion: 'Will my child definitely find employment after completing this course?',

    concernFurtherEducationTitle: 'Study More',
    concernFurtherEducationSubtitle: 'Can my child study further?',
    concernFurtherEducationQuestion: 'Can my child pursue a Polytechnic Diploma or degree after ITI certification?',

    concernSocialPerceptionTitle: 'Respect',
    concernSocialPerceptionSubtitle: 'What will others think?',
    concernSocialPerceptionQuestion: 'Is this vocational career respectable, recognized, and good for my family?',

    concernDistanceTitle: 'Distance',
    concernDistanceSubtitle: 'Is the work too far from home?',
    concernDistanceQuestion: 'Are there employment opportunities near our home location or district?',

    concernWorkingConditionsTitle: 'Work Safety',
    concernWorkingConditionsSubtitle: 'What is the work like? Is it safe?',
    concernWorkingConditionsQuestion: 'What are the daily working conditions and workshop safety standards in this trade?',

    concernCareerGrowthTitle: 'Growth',
    concernCareerGrowthSubtitle: 'Can my child get a better job later?',
    concernCareerGrowthQuestion: 'How does career progression, hierarchy, and salary growth look over time?',

    concernOtherTitle: 'Other Question',
    concernOtherSubtitle: 'I have another worry or question.',
    concernOtherQuestion: 'I have a specific question about my child’s career path.',
    
    // Relationships
    relMother: 'Mother',
    relFather: 'Father',
    relGuardian: 'Guardian',
    relParent: 'Parent',
    
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
    switchToStudent: 'విద్యార్థి వీక్షణకు మారండి',
    switchToParent: 'తల్లిదండ్రుల వీక్షణకు మారండి',
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
    
    // Parent Portal High-Clarity Actions & Dashboard
    yourChild: 'మీ బిడ్డ',
    careerNotSelected: 'ఇంకా వృత్తిని ఎంచుకోలేదు',
    whatWouldYouLikeToKnow: 'మీరు ఏమి తెలుసుకోవాలనుకుంటున్నారు?',
    parentQuestionSubtitle: 'కౌన్సెలర్ ద్వారా ఖచ్చితమైన, ధృవీకరించబడిన సమాచారాన్ని తెలుసుకోవడానికి క్రింది అంశాలలో ఒకదాన్ని ఎంచుకోండి.',
    parentQuestion: 'నా బిడ్డ ఏమి చేయాలనుకుంటున్నారు?',
    parentChildSummary: 'కెరీర్ ప్రణాళికలు, జీతం వివరాలు మరియు భవిష్యత్తు మార్గాలను పరిశీలించండి.',
    parentVoiceAction: 'తెలుగు లేదా ఇంగ్లీషులో మాట్లాడటానికి నొక్కండి',
    parentVoiceSubtext: 'టైప్ చేయకుండానే ఉద్యోగ భద్రత, జీతం లేదా ఉన్నత చదువుల గురించి అడగండి',
    parentSalaryConcern: 'ఈ ఉద్యోగం స్థిరమైనదేనా మరియు ఎంత జీతం వస్తుంది?',
    parentSafetyConcern: 'పని వాతావరణం నా బిడ్డకు సురక్షితమైనదేనా?',
    parentProgressionConcern: 'నా బిడ్డ తర్వాత డిగ్రీ లేదా ఉన్నత చదువులు చదవవచ్చా?',
    parentTalkCounsellor: 'కుటుంబ కౌన్సెలర్‌తో మాట్లాడండి',

    // Human Escalation (Brick 31)
    escalationPromptTitle: 'మరింత వ్యక్తిగత మార్గదర్శకత్వం కావాలా?',
    escalationPromptSubtitle: 'కొన్నిసార్లు ఒక వ్యక్తితో నేరుగా మాట్లాడటం ద్వారా సందేహాలు సులభంగా నివృత్తి అవుతాయి. కౌన్సిలర్ మీ పిల్లల భవిష్యత్తు అవకాశాలను అర్థం చేసుకోవడంలో సహాయపడగలరు.',
    escalationModalTitle: 'మానవ కౌన్సిలర్ సంప్రదింపు అభ్యర్థన',
    escalationModalDesc: 'సర్టిఫైడ్ వృత్తి విద్యా కౌన్సిలర్ మీ ప్రశ్నలు మరియు కెరీర్ ఎంపికలను పరిశీలించి మీకు వ్యక్తిగతంగా మార్గదర్శకత్వం అందిస్తారు.',
    escalationConcernLabel: 'మీ ప్రధాన సందేహం లేదా ఆందోళన ఏమిటి?',
    escalationNotesPlaceholder: 'మీరు చర్చించాలనుకుంటున్న అంశాన్ని క్లుప్తంగా తెలపండి (ఐచ్ఛికం)...',
    escalationConfirmAction: 'నిర్ధారించి అభ్యర్థన పంపండి',
    escalationCancelAction: 'రద్దు చేయండి',
    escalationSending: 'అభ్యర్థన పంపబడుతోంది...',
    escalationSentSuccess: 'మీ అభ్యర్థన విజయవంతంగా పంపబడింది.',
    escalationSentSubtext: 'మానవ కౌన్సిలర్ మీ సందేహాన్ని త్వరలో పరిశీలిస్తారు.',
    escalationStatusPending: 'సమీక్ష పెండింగ్‌లో ఉంది',
    escalationStatusInProgress: 'కౌన్సిలర్ పరిశీలనలో ఉంది',
    escalationStatusResolved: 'పరిష్కరించబడింది',
    escalationActiveBanner: 'మీ కౌన్సిలింగ్ అభ్యర్థన ప్రస్తుతం మానవ కౌన్సిలర్ పరిశీలనలో ఉంది.',
    escalationResolvedNotice: 'మీ మునుపటి కౌన్సిలింగ్ అభ్యర్థన పరిష్కరించబడింది. మీకు మరో సందేహం ఉంటే కొత్త అభ్యర్థనను పంపవచ్చు.',
    
    // Parent 6 Core Question Cards (Natural, culturally meaningful Telugu)
    cardIncomeTitle: 'ఆదాయం & జీతం',
    cardIncomeDesc: 'అందుబాటులో ఉన్న జీతభత్యాలు మరియు భవిష్యత్ సంపాదన వివరాలను తెలుసుకోండి.',
    cardIncomeQuestion: 'ఈ వృత్తికి సంబంధించి ఎంత ఆదాయం లేదా జీతం లభిస్తుంది?',
    
    cardJobSecurityTitle: 'ఉద్యోగ భద్రత',
    cardJobSecurityDesc: 'ఉద్యోగావకాశాలు మరియు భద్రతకు సంబంధించిన నిజమైన సమాచారాన్ని పరిశీలించండి.',
    cardJobSecurityQuestion: 'ఈ వృత్తిలో ఉద్యోగ అవకాశాలు మరియు భద్రత ఎలా ఉంటాయి?',
    
    cardFurtherEducationTitle: 'ఉన్నత విద్య & శిక్షణ',
    cardFurtherEducationDesc: 'ఈ కోర్సు తర్వాత చదవగలిగే తదుపరి విద్యా మార్గాలు మరియు డిప్లొమా అవకాశాలు.',
    cardFurtherEducationQuestion: 'ఈ వృత్తి శిక్షణ పూర్తయిన తర్వాత ఇంకా ఏ ఉన్నత చదువులు చదవవచ్చు?',
    
    cardCareerGrowthTitle: 'కెరీర్ ఎదుగుదల',
    cardCareerGrowthDesc: 'అనుభవంతో పాటు పెరిగే హోదా మరియు భవిష్యత్ పదోన్నతుల వివరాలు.',
    cardCareerGrowthQuestion: 'ఈ వృత్తిలో భవిష్యత్ పదోన్నతులు మరియు కెరీర్ ఎదుగుదల ఎలా ఉంటుంది?',
    
    cardWorkNearHomeTitle: 'సమీపంలో ఉద్యోగావకాశాలు',
    cardWorkNearHomeDesc: 'మీ ప్రాంతం మరియు ప్రాధాన్యత ప్రదేశాలలో లభించే అవకాశాలను తెలుసుకోండి.',
    cardWorkNearHomeQuestion: 'మా ప్రాంతానికి సమీపంలో ఈ వృత్తికి సంబంధించిన ఎలాంటి ఉద్యోగావకాశాలు ఉన్నాయి?',
    
    cardTalkToAiTitle: 'కౌన్సెలర్‌తో మాట్లాడండి',
    cardTalkToAiDesc: 'మీ బిడ్డ భవిష్యత్తు గురించి మీకు నచ్చిన ఏదైనా సందేహాన్ని అడగండి.',
    
    // Parent Empty & Error States (Natural Telugu sentence formation)
    parentNoStudentLinkedTitle: 'మీ ఖాతాకు ఇంకా ఏ విద్యార్థి ప్రొఫైల్ అనుసంధానించబడలేదు.',
    parentNoStudentLinkedDesc: 'మీ కుటుంబ ఖాతాకు మీ బిడ్డ విద్యార్థి ప్రొఫైల్ జతచేయబడిన తర్వాత, వారి వృత్తి ఎంపికలు, శిక్షణా మార్గాలు మరియు సలహాలను ఇక్కడ చూడవచ్చు.',
    parentLoadingChild: 'మీ బిడ్డ సమాచారం లోడ్ అవుతోంది...',
    parentLoadingSubtext: 'ధృవీకరించబడిన కుటుంబ రికార్డులతో సురక్షితంగా అనుసంధానించబడుతోంది...',
    parentErrorTitle: 'మీ బిడ్డ సమాచారాన్ని పొందడం సాధ్యం కాలేదు. దయచేసి మళ్లీ ప్రయత్నించండి.',
    parentErrorSubtext: 'ప్రస్తుతం సర్వర్ల నుండి సంబంధిత ప్రొఫైల్ వివరాలు అందలేదు.',
    tryAgain: 'మళ్లీ ప్రయత్నించండి',

    // Parent Counselling Header & Starters (Natural Telugu syntax and phrasing)
    parentCounsellorTitle: 'తల్లిదండ్రుల వృత్తి విద్యా మార్గదర్శి',
    parentCounsellorSubtitle: 'ప్రభుత్వ గుర్తింపు పొందిన అధికారిక సమాచారంతో కుటుంబాలకు మార్గదర్శకత్వం',
    familyContextProtected: 'కుటుంబ వివరాలు భద్రపరచబడ్డాయి',
    parentGuidanceMode: 'తల్లిదండ్రుల మార్గదర్శక విభాగం',
    parentExplainNotice: 'మీరు వివరణ కోరిన అంశం:',
    parentFocus: 'ముఖ్య అంశం:',
    vocationalGuidanceForParents: 'తల్లిదండ్రుల కోసం వృత్తి విద్యా మార్గదర్శనం',
    parentIntroPrompt: 'మీ బిడ్డ శిక్షణ ఎంపికలు, ఉద్యోగ భద్రత, ప్రారంభ జీతం లేదా పని ప్రదేశ భద్రతా ప్రమాణాల గురించి ఏవైనా సందేహాలు అడగండి.',
    qJobSecurityTitle: 'ఉద్యోగ భద్రత & జీతభత్యాలు',
    qJobSecurityPrompt: 'సర్టిఫైడ్ ITI టెక్నీషియన్లకు ఉద్యోగ స్థిరత్వం మరియు ప్రారంభ జీతం ఎంతవరకు ఉంటాయి?',
    qVocationalVsDegreeTitle: 'వృత్తి విద్యా కోర్సు vs డిగ్రీ',
    qVocationalVsDegreePrompt: 'సాధారణ విశ్వవిద్యాలయ డిగ్రీతో పోలిస్తే NSQF లెవెల్ 4 వృత్తి విద్యా కోర్సు ఎలాంటి ప్రయోజనాలను ఇస్తుంది?',
    qWorkshopSafetyTitle: 'వర్క్‌షాప్ భద్రతా ప్రమాణాలు',
    qWorkshopSafetyPrompt: 'ప్రభుత్వ ITI సంస్థల్లో విద్యార్థుల కోసం ఎలాంటి భద్రతా ప్రమాణాలు మరియు శిక్షణ వాతావరణం ఉంటాయి?',
    qFurtherStudyTitle: 'తదుపరి ఉన్నత విద్య అవకాశాలు',
    qFurtherStudyPrompt: 'ITI సర్టిఫికేషన్ పూర్తయిన తర్వాత నా బిడ్డ ఇంజనీరింగ్ పాలిటెక్నిక్ డిప్లొమా లేదా డిగ్రీ చదవవచ్చా?',

    // Brick 29: Parent AI Counselling & Voice Controls (Natural Telugu Formations)
    parentYou: 'మీరు (తల్లిదండ్రులు)',
    studentYou: 'మీరు (విద్యార్థి)',
    vocationalCounsellor: 'వృత్తి విద్యా కౌన్సెలర్',
    listenToAnswer: 'వినండి',
    stopListening: 'ఆపండి',
    ttsUnavailable: 'ఈ బ్రౌజర్‌లో వాయిస్ వినిపించే సౌకర్యం ప్రస్తుతం అందుబాటులో లేదు.',
    notFullySureNotice: 'ఈ అంశానికి సంబంధించి పూర్తి నిశ్చయంతో సమాధానం ఇవ్వడానికి నా వద్ద తగినంత ధృవీకరించబడిన సమాచారం లేదు.',
    talkToHumanCounsellor: 'మానవ కౌన్సెలర్‌తో మాట్లాడండి',
    humanReviewAdvised: 'అనుభవజ్ఞులైన కౌన్సెలర్ పరిశీలన సిఫార్సు చేయబడింది',
    statutoryRecordsSupported: 'ప్రభుత్వ అధికారిక రికార్డుల ద్వారా ధృవీకరించబడిన సమాచారం',
    generalGuidanceNotice: 'సాధారణ మార్గదర్శక సమాచారం',
    limitedDataNotice: 'పరిమితమైన అధికారిక సమాచారం మాత్రమే అందుబాటులో ఉంది',
    askByVoice: 'మీ సందేహాన్ని మాట్లాడి అడగండి',
    voiceHelpText: 'మైక్రోఫోన్ నొక్కి తెలుగు లేదా ఇంగ్లీషులో సాధారణంగా మాట్లాడండి',
    thinkingCounsellor: 'సమాధానం కోసం ఆలోచిస్తున్నాము...',
    preparingAnswer: 'మీ ప్రశ్నకు సమాధానాన్ని సిద్ధం చేస్తున్నాము...',
    voicePromptBannerTitle: '🎙️ మీ సందేహాన్ని మాట్లాడి అడగండి',
    voicePromptBannerSubtitle: 'మీరు టైప్ చేయనవసరం లేదు. మాట్లాడటానికి మైక్రోఫోన్ నొక్కి అడిగితే, ధృవీకరించబడిన సమాధానం వినవచ్చు.',
    speakNaturallySamples: 'ఉదాహరణలు: "కోర్సు తర్వాత నా బిడ్డకు ఉద్యోగం వస్తుందా?" • "ఎంత సంపాదించగలరు?" • "మా ఊరి సమీపంలోనే పని దొరుకుతుందా?"',

    // Brick 30: Voice Counselling (STT & TTS States & Messages - Natural Telugu)
    voiceIdleBtn: 'మాట్లాడటానికి నొక్కండి',
    voiceListeningBtn: 'వింటున్నాము... మాట్లాడండి',
    voiceProcessing: 'ఆలోచిస్తున్నాము...',
    voiceSpeaking: 'సమాధానం వినిపిస్తోంది...',
    stopSpeech: 'ఆపండి',
    youSaid: 'మీరు అడిగిన ప్రశ్న:',
    sendQuestion: 'పంపండి',
    speakAgain: 'మళ్లీ మాట్లాడండి',
    tryAgainVoice: 'మళ్లీ ప్రయత్నించండి',
    sttFailedMessage: 'మీ మాటలు స్పష్టంగా వినపడలేదు. దయచేసి మళ్లీ మాట్లాడండి.',
    ttsFailedMessage: 'మీ సమాధానం సిద్ధంగా ఉంది. ప్రస్తుతం వాయిస్ ప్లేబ్యాక్ అందుబాటులో లేదు. మీరు క్రింద సమాధానాన్ని చదువుకోవచ్చు.',
    talkToHumanCounsellorVoice: 'మీరు ప్రత్యక్ష కౌన్సెలర్‌తో మాట్లాడాలనుకుంటున్నారా?',
    voiceQuestionHelp: 'ఉద్యోగం, జీతం, శిక్షణ లేదా పని భద్రత గురించి ఏదైనా ప్రశ్న అడగండి.',

    // Brick 28: Parent Concerns (Natural Telugu Phrasing for Low-Literacy / Family Context)
    whatAreYouWorriedAbout: 'మీరు దేని గురించి ఆందోళన చెందుతున్నారు?',
    concernsSubtext: 'మీకు ఎక్కువగా సందేహం ఉన్న అంశాన్ని ఎంచుకోండి. మేము సరళమైన, నిజమైన సమాచారాన్ని అందిస్తాము.',
    talkToPerson: 'కౌన్సెలర్‌తో మాట్లాడండి',
    talkToPersonDesc: 'ప్రత్యక్షంగా మానవ కౌన్సెలర్‌తో మాట్లాడాలనుకుంటున్నారా?',
    backToDashboard: 'తిరిగి డ్యాష్‌బోర్డ్‌కు',
    tellUsConcernVoice: 'మీ ఆందోళనను మాట్లాడి చెప్పండి',
    speakNow: 'వింటున్నాము... మీ ప్రశ్నను ఇప్పుడు మాట్లాడండి',
    tapToSpeak: 'చదవడానికి లేదా టైప్ చేయడానికి బదులుగా మాట్లాడటానికి మైక్రోఫోన్ నొక్కండి',
    readAloud: 'ఈ ప్రశ్నను వినండి',
    playingAudio: 'చదివి వినిపిస్తోంది...',
    otherConcernModalTitle: 'మీ ప్రశ్న లేదా సందేహాన్ని చెప్పండి',
    otherConcernModalSubtitle: 'మీ ఆందోళనను ఇక్కడ టైప్ చేయండి లేదా మైక్రోఫోన్ ద్వారా మాట్లాడండి.',
    typeOrSpeakPlaceholder: 'ఉదాహరణకు: హాస్టల్ సౌకర్యం ఉంటుందా? మా జిల్లాలోనే ఉద్యోగం దొరుకుతుందా?',
    continueToCounsellor: 'కౌన్సెలర్‌ను అడగండి',
    savingConcern: 'కౌన్సెలర్‌తో అనుసంధానించబడుతోంది...',
    humanEscalationConfirmation: 'మిమ్మల్ని ప్రత్యక్ష వృత్తి విద్యా కౌన్సెలర్‌తో అనుసంధానిస్తున్నాము.',

    // 8 Exact Parent Concern Cards (Telugu)
    concernIncomeTitle: 'ఆదాయం & జీతం',
    concernIncomeSubtitle: 'నా బిడ్డ తగినంత సంపాదించగలరా?',
    concernIncomeQuestion: 'ఈ వృత్తిలో నా బిడ్డ ఎంతవరకు సంపాదించవచ్చు? ప్రారంభ జీతం ఎంత ఉంటుంది?',

    concernJobSecurityTitle: 'ఉద్యోగ భద్రత',
    concernJobSecuritySubtitle: 'నా బిడ్డకు ఉద్యోగం ఖచ్చితంగా దొరుకుతుందా?',
    concernJobSecurityQuestion: 'ఈ వృత్తి శిక్షణ పూర్తయిన తర్వాత ఉద్యోగావకాశాలు మరియు భద్రత ఎలా ఉంటాయి?',

    concernFurtherEducationTitle: 'పై చదువులు',
    concernFurtherEducationSubtitle: 'నా బిడ్డ తర్వాత ఇంకా పై చదువులు చదువుకోవచ్చా?',
    concernFurtherEducationQuestion: 'ఈ కోర్సు పూర్తయిన తర్వాత పాలిటెక్నిక్ డిప్లొమా లేదా ఇతర ఉన్నత చదువులు చదవవచ్చా?',

    concernSocialPerceptionTitle: 'సమాజంలో గౌరవం',
    concernSocialPerceptionSubtitle: 'బంధువులు మరియు ఇతరులు ఏమనుకుంటారు?',
    concernSocialPerceptionQuestion: 'ఈ వృత్తికి సమాజంలో గౌరవం మరియు ప్రభుత్వ గుర్తింపు ఉంటాయా?',

    concernDistanceTitle: 'సమీపంలో పని',
    concernDistanceSubtitle: 'పని ఇంటికి చాలా దూరంగా ఉంటుందా?',
    concernDistanceQuestion: 'మా ప్రాంతానికి లేదా సమీప పట్టణాలకు దగ్గరగా ఉద్యోగావకాశాలు ఉన్నాయా?',

    concernWorkingConditionsTitle: 'పని వాతావరణం',
    concernWorkingConditionsSubtitle: 'పని ఎలా ఉంటుంది? సురక్షితమైనదేనా?',
    concernWorkingConditionsQuestion: 'ఈ వృత్తిలో పని వాతావరణం, శారీరక శ్రమ మరియు భద్రతా ప్రమాణాలు ఎలా ఉంటాయి?',

    concernCareerGrowthTitle: 'కెరీర్ ఎదుగుదల',
    concernCareerGrowthSubtitle: 'భవిష్యత్తులో మంచి పదోన్నతి వస్తుందా?',
    concernCareerGrowthQuestion: 'అనుభవం పెరిగే కొద్దీ ఈ వృత్తిలో పదోన్నతులు మరియు జీతాల పెరుగుదల ఎలా ఉంటాయి?',

    concernOtherTitle: 'ఇతర సందేహం',
    concernOtherSubtitle: 'నాకు వేరొక సందేహం లేదా ప్రశ్న ఉంది.',
    concernOtherQuestion: 'నా బిడ్డ వృత్తి విద్య గురించి నాకు ఒక ప్రత్యేక సందేహం ఉంది.',
    
    // Relationships
    relMother: 'తల్లి',
    relFather: 'తండ్రి',
    relGuardian: 'సంరక్షకులు',
    relParent: 'తల్లిదండ్రులు',
    
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

  const localizeName = (name?: string | null): string => {
    if (!name) return language === 'te' ? 'మీ బిడ్డ' : 'Your Child';
    // Strip developer tags such as (Dev Student) or (Dev ...)
    const clean = name.replace(/\s*\([^)]*dev[^)]*\)/gi, '').trim();
    if (language === 'te') {
      const lower = clean.toLowerCase();
      if (lower.includes('aarav sharma') || lower === 'aarav') return 'ఆరవ్ శర్మ';
      if (lower.includes('priya patel') || lower === 'priya') return 'ప్రియా పటేల్';
      if (lower.includes('sunita sharma') || lower === 'sunita') return 'సునీతా శర్మ';
      if (lower.includes('rajesh verma') || lower === 'rajesh') return 'డాక్టర్ రాజేష్ వర్మ';
      if (lower.includes('rohan')) return 'రోహన్';
      if (lower.includes('ananya')) return 'అనన్య';
      if (lower.includes('kavya')) return 'కావ్య';
      if (lower.includes('sai')) return 'సాయి';
    }
    return clean || (language === 'te' ? 'మీ బిడ్డ' : 'Your Child');
  };

  const localizeCareerTitle = (title?: string | null): string => {
    if (!title || title === 'Career not selected yet') {
      return t('careerNotSelected');
    }
    if (language === 'te') {
      const lower = title.toLowerCase();
      if (lower.includes('automotive service technician')) return 'ఆటోమోటివ్ సర్వీస్ టెక్నీషియన్';
      if (lower.includes('solar panel')) return 'సోలార్ ప్యానెల్ ఇన్‌స్టాలేషన్ టెక్నీషియన్';
      if (lower.includes('general duty assistant')) return 'జనరల్ డ్యూటీ అసిస్టెంట్ (ఆరోగ్య సంరక్షణ)';
      if (lower.includes('electrician')) return 'ఎలక్ట్రీషియన్';
      if (lower.includes('welder')) return 'వెల్డర్';
      if (lower.includes('fitter')) return 'ఫిట్టర్';
      if (lower.includes('plumber')) return 'ప్లంబర్';
      if (lower.includes('carpenter')) return 'కార్పెంటర్';
      if (lower.includes('machinist')) return 'సిఎన్‌సి మెషినిస్ట్';
      if (lower.includes('data entry')) return 'డేటా ఎంట్రీ ఆపరేటర్';
      if (lower.includes('draughtsman civil')) return 'డ్రాఫ్ట్స్‌మన్ (సివిల్)';
      if (lower.includes('draughtsman mechanical')) return 'డ్రాఫ్ట్స్‌మన్ (మెకానికల్)';
      if (lower.includes('mechanic diesel')) return 'మెకానిక్ డీజిల్';
      if (lower.includes('motor vehicle')) return 'మెకానిక్ మోటార్ వెహికల్';
      if (lower.includes('wireman')) return 'వైర్‌మ్యాన్';
      if (lower.includes('electronics')) return 'ఎలక్ట్రానిక్స్ మెకానిక్';
      if (lower.includes('refrigeration') || lower.includes('air conditioning')) {
        return 'శీతలీకరణ & ఎయిర్ కండిషనింగ్ టెక్నీషియన్';
      }
    }
    return title;
  };

  const localizeEducation = (edu?: string | null): string => {
    if (!edu) return '';
    if (language === 'te') {
      const lower = edu.toLowerCase();
      if (lower.includes('10')) return '10వ తరగతి ఉత్తీర్ణత';
      if (lower.includes('12')) return '12వ తరగతి ఉత్తీర్ణత';
      if (lower.includes('8')) return '8వ తరగతి ఉత్తీర్ణత';
      if (lower.includes('iti')) return 'ఐటీఐ సర్టిఫికేట్';
      if (lower.includes('diploma')) return 'డిప్లొమా';
      if (lower.includes('graduate')) return 'గ్రాడ్యుయేట్ / డిగ్రీ';
    }
    return edu;
  };

  const localizeLocation = (loc?: string | null): string => {
    if (!loc) return '';
    if (language === 'te') {
      const lower = loc.toLowerCase().replace(/[\s_-]/g, '');
      if (lower.includes('andhrapradesh') || lower.includes('andhra')) return 'ఆంధ్రప్రదేశ్';
      if (lower.includes('telangana')) return 'తెలంగాణ';
      if (lower.includes('medak')) return 'మెదక్';
      if (lower.includes('hyderabad')) return 'హైదరాబాద్';
      if (lower.includes('guntur')) return 'గుంటూరు';
      if (lower.includes('vijayawada')) return 'విజయవాడ';
      if (lower.includes('warangal')) return 'వరంగల్';
      if (lower.includes('khammam')) return 'ఖమ్మం';
      if (lower.includes('kurnool')) return 'కర్నూలు';
      if (lower.includes('visakhapatnam')) return 'విశాఖపట్నం';
      if (lower.includes('srikakulam')) return 'శ్రీకాకుళం';
      if (lower.includes('nizamabad')) return 'నిజామాబాద్';
      if (lower.includes('karimnagar')) return 'కరీంనగర్';
    }
    return loc;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        localizeName,
        localizeCareerTitle,
        localizeEducation,
        localizeLocation,
      }}
    >
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
