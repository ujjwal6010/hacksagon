import React, { useState, useEffect } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { Link as ScrollLink, Element } from 'react-scroll';
import {
  Mic,
  Heart,
  Baby,
  BookOpen,
  Users,
  ArrowRight,
  ShieldCheck,
  Activity,
  MessageCircle,
  Stethoscope,
  LogOut,
  User as UserIcon,
  MessageSquare,
  Bot,
  Calendar,
  Award,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Clock,
  Utensils,
  Globe,
  Loader,
  Ear,
  RotateCcw,
  Phone,
  X
} from 'lucide-react';
import Auth from './Auth';
import Dashboard from './Dashboard';

const HERO_IMAGE = 'https://clipart-library.com/2024/pregnant-woman-cartoon/pregnant-woman-cartoon-1.jpg';
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Navbar = ({ onAuthClick, user, onLogout, onContactClick, contactLoading, setView, currentView }) => {
  return (
    <nav className="glass-nav">
      <div className="container nav-inner">
        <ScrollLink
          to="home"
          smooth={true}
          duration={500}
          className="nav-brand"
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <span style={{ fontSize: '1.62rem', fontWeight: '800', color: 'var(--primary)', fontFamily: 'Sora', letterSpacing: '0.02em' }}>Janani</span>
        </ScrollLink>
        <div className="nav-links" style={{ display: 'flex', gap: '1.8rem' }}>
          {['Home', 'Care', 'Mission'].map((item) => (
            <ScrollLink
              key={item}
              to={item.toLowerCase()}
              smooth={true}
              duration={500}
              offset={-70}
              onClick={() => setView('landing')}
              className={`nav-link ${currentView === 'landing' ? 'nav-link-active' : ''}`}
              style={{
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '1rem',
                color: currentView === 'landing' ? 'var(--text-dark)' : '#64748b',
                transition: 'color 0.25s ease'
              }}
            >
              {item}
            </ScrollLink>
          ))}
          {user && (
            <button
              onClick={() => setView('dashboard')}
              className={`nav-link ${currentView === 'dashboard' ? 'nav-link-active' : ''}`}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '1rem',
                color: currentView === 'dashboard' ? 'var(--primary)' : '#64748b',
                fontFamily: 'inherit',
                transition: 'color 0.25s ease'
              }}
            >
              Dashboard
            </button>
          )}
        </div>
        <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <button
            onClick={onContactClick}
            disabled={contactLoading}
            className="nav-btn-outline nav-contact-btn"
            style={{
              padding: '0.58rem 1.3rem',
              opacity: contactLoading ? 0.7 : 1
            }}
          >
            {contactLoading ? 'Calling...' : 'Contact'}
          </button>
          {user ? (
            <div className="nav-user-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="nav-user-name" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: '600' }}>
                <UserIcon size={18} />
                <span>{user.name}</span>
              </div>
              <button onClick={onLogout} className="nav-btn-solid" style={{ padding: '0.58rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <LogOut size={16} /> Logout
              </button>
            </div>
          ) : (
            <button onClick={onAuthClick} className="nav-btn-solid" style={{ padding: '0.58rem 1.2rem' }}>Login</button>
          )}
        </div>
      </div>
    </nav>
  );
};


const Hero = ({ onAuthClick, user, setView }) => {
  const [petals, setPetals] = useState([]);

  const spawnPetals = (x, y) => {
    const newPetals = Array.from({ length: 12 }).map(() => ({
      id: Math.random(),
      x,
      y,
      size: Math.random() * 15 + 10,
      rotation: Math.random() * 360,
      drift: (Math.random() - 0.5) * 200,
      duration: Math.random() * 2 + 2,
    }));
    setPetals((prev) => [...prev, ...newPetals]);
  };

  return (
    <Element name="home" onClick={(e) => spawnPetals(e.clientX, e.clientY)}>
      <div style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 9999 }}>
        <AnimatePresence>
          {petals.map((petal) => (
            <Motion.div
              key={petal.id}
              initial={{ opacity: 0.8, scale: 0, x: petal.x, y: petal.y, rotate: petal.rotation }}
              animate={{
                opacity: 0,
                scale: [0.5, 1, 0.8],
                y: petal.y + 400 + Math.random() * 200,
                x: petal.x + petal.drift,
                rotate: petal.rotation + (Math.random() > 0.5 ? 180 : -180)
              }}
              transition={{ duration: petal.duration, ease: "easeOut" }}
              onAnimationComplete={() => setPetals((prev) => prev.filter((p) => p.id !== petal.id))}
              style={{
                position: 'absolute',
                width: petal.size,
                height: petal.size * 0.7,
                background: 'linear-gradient(135deg, #ff69b4, #fce4ec)',
                borderRadius: '50% 0 50% 50%',
                boxShadow: '0 2px 5px rgba(255, 105, 180, 0.2)',
              }}
            />
          ))}
        </AnimatePresence>
      </div>
      <section className="container" style={{ paddingTop: '1px', cursor: 'pointer' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4rem',
          flexDirection: 'row',
          flexWrap: 'wrap'
        }}>
          <Motion.div
            className="hero-copy-shell"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            style={{ flex: '1', minWidth: '300px', textAlign: 'left', position: 'relative', isolation: 'isolate' }}
          >
            <div className="hero-blob hero-blob-copy" aria-hidden="true" />
            <Motion.h1
              className="gradient-text"
              style={{ fontSize: 'clamp(3rem, 9vw, 5.7rem)', lineHeight: '1.05', marginBottom: '1.2rem', fontWeight: '800' }}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              Janani
            </Motion.h1>
            <h2 style={{ fontSize: 'clamp(1.45rem, 3vw, 2.25rem)', color: 'var(--text-dark)', marginBottom: '1.6rem', fontWeight: '700', lineHeight: '1.28' }}>
              AI-Powered Multilingual Voice Assistant for <span style={{ color: 'var(--primary)' }}>Rural Maternal Care</span>
            </h2>

            <p style={{ fontSize: '1.08rem', color: 'var(--text-light)', marginBottom: '2.5rem', maxWidth: '560px' }}>
              Empowering Rural Women with RAG-Based Medical Intelligence.
              Providing life-saving prenatal care insights through simple, natural voice conversations.
            </p>

            <div style={{ display: 'flex', gap: '1.5rem' }}>
              {!user && (
                <button
                  onClick={onAuthClick}
                  className="btn-primary"
                  style={{ padding: '1rem 2.5rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  Get Started <ArrowRight size={20} />
                </button>
              )}
              {user && (
                <button
                  onClick={() => setView('dashboard')}
                  className="btn-primary"
                  style={{ padding: '1rem 2.5rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  Go to Dashboard <ArrowRight size={20} />
                </button>
              )}
              <ScrollLink to="mission" smooth={true} duration={800} offset={-70}>
                <button style={{
                  background: 'transparent',
                  border: '2px solid var(--primary)',
                  color: 'var(--primary)',
                  padding: '1rem 2rem',
                  borderRadius: '50px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}>
                  Learn More
                </button>
              </ScrollLink>
            </div>
          </Motion.div>


          <Motion.div
            className="hero-art-shell"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            style={{ flex: '1', minWidth: '300px', display: 'flex', justifyContent: 'center', position: 'relative', isolation: 'isolate' }}
          >
            <div className="hero-blob hero-blob-art" aria-hidden="true" />
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '115%',
              height: '115%',
              background: 'var(--accent)',
              borderRadius: '50%',
              filter: 'blur(60px)',
              zIndex: -1,
              opacity: 0.6
            }}></div>
            <img
              className="hero-image-mask hero-illustration-float"
              src={HERO_IMAGE}
              alt="Maternal Health"
              style={{
                width: '100%',
                maxWidth: '450px',
                height: '450px',
                objectFit: 'cover',
                borderRadius: '50%',
                border: '6px solid rgba(255, 255, 255, 0.9)'
              }}
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1559832306-27a0278d99a7?auto=format&fit=crop&q=80&w=1000';
              }}
            />
          </Motion.div>
        </div>
      </section>
    </Element>
  );
};

const CareSection = () => {
  return (
    <Element name="care">
      <section
        style={{
          background: 'linear-gradient(180deg, rgba(255, 247, 242, 0) 0%, #fffaf7 24%, #ffffff 100%)'
        }}
      >
        <div className="container text-center" style={{ textAlign: 'center' }}>
          <Motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Seeing is Believing</h2>
            <p style={{ maxWidth: '700px', margin: '0 auto 4rem', color: 'var(--text-light)' }}>
              Watch how MatriCare AI transforms the complex prenatal tracking process into a simple, natural conversation.
            </p>

            <div style={{
              width: '100%',
              maxWidth: '900px',
              margin: '0 auto',
              aspectRatio: '16/9',
              background: '#000',
              borderRadius: '30px',
              overflow: 'hidden',
              position: 'relative',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}>
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/_dVuHFdUN0c"
                title="Care Video: Voice-Based Tracking"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </Motion.div>
        </div>
      </section>
    </Element>
  );
};

const FeatureCard = ({ icon: Icon, title, desc, delay }) => (
  <Motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.6 }}
    className="hover-lift surface-card"
    style={{
      background: 'white',
      padding: '2.5rem',
      borderRadius: '24px',
      textAlign: 'left',
      boxShadow: 'var(--shadow-md)',
      border: '1px solid rgba(177, 36, 79, 0.1)'
    }}
  >
    <div style={{
      background: '#f1f8e9',
      width: '60px',
      height: '60px',
      borderRadius: '16px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: '1.5rem'
    }}>
      <Icon color="var(--primary)" size={32} />
    </div>
    <h3 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>{title}</h3>
    <p style={{ color: 'var(--text-light)', fontSize: '0.95rem' }}>{desc}</p>
  </Motion.div>
);

const SARVAM_API_KEY = "sk_94vvqhgo_opzIH8VOZKtoPs894jfnFGAZ";

const SUPPORTED_LANGUAGES = [
  { code: 'unknown', label: 'Auto Detect', native: 'स्वचालित पहचान' },
  { code: 'hi-IN', label: 'Hindi', native: 'हिंदी' },
  { code: 'en-IN', label: 'English', native: 'English' },
  { code: 'pa-IN', label: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'bn-IN', label: 'Bengali', native: 'বাংলা' },
  { code: 'mr-IN', label: 'Marathi', native: 'मराठी' },
  { code: 'gu-IN', label: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'ta-IN', label: 'Tamil', native: 'தமிழ்' },
  { code: 'te-IN', label: 'Telugu', native: 'తెలుగు' },
  { code: 'kn-IN', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml-IN', label: 'Malayalam', native: 'മലയാളം' },
  { code: 'or-IN', label: 'Odia', native: 'ଓଡ଼ିଆ' },
  { code: 'as-IN', label: 'Assamese', native: 'অসমীয়া' },
  { code: 'ur-IN', label: 'Urdu', native: 'اردو' },
  { code: 'sa-IN', label: 'Sanskrit', native: 'संस्कृतम्' },
  { code: 'ks-IN', label: 'Kashmiri', native: 'کأشُر' },
  { code: 'sd-IN', label: 'Sindhi', native: 'سنڌي' },
  { code: 'doi-IN', label: 'Dogri', native: 'डोगरी' },
  { code: 'kok-IN', label: 'Konkani', native: 'कोंकणी' },
  { code: 'mni-IN', label: 'Manipuri', native: 'মণিপুরী' },
  { code: 'mai-IN', label: 'Maithili', native: 'मैथिली' },
  { code: 'sat-IN', label: 'Santali', native: 'संताली' },
  { code: 'ne-NP', label: 'Nepali', native: 'नेपाली' }
];

const VoiceInterface = ({ user }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [interactionMode, setInteractionMode] = useState('IDLE');
  const [activeInputMode, setActiveInputMode] = useState('voice');
  const [selectedLanguage, setSelectedLanguage] = useState('unknown');
  const [detectedLang, setDetectedLang] = useState(null);
  const [lastAudioBase64, setLastAudioBase64] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const audioChunksRef = React.useRef([]);
  const audioPlayerRef = React.useRef(new Audio());
  const holdTimerRef = React.useRef(null);
  const isHoldingRef = React.useRef(false);

  useEffect(() => {
    audioPlayerRef.current.onended = () => {
      setInteractionMode('IDLE');
    };
  }, []);

  const resetSession = () => {
    audioPlayerRef.current.pause();
    audioPlayerRef.current.currentTime = 0;
    setInteractionMode('IDLE');
    setTranscript('');
    setResponse('');
    setDetectedLang(null);
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleOrbClick = () => {
    if (interactionMode === 'IDLE' || interactionMode === 'ERROR') {
      startRecording();
    } else if (interactionMode === 'LISTENING') {
      stopRecording();
    } else {
      resetSession();
    }
  };

  const handleRepeatAudio = () => {
    if (lastAudioBase64) {
      audioPlayerRef.current.currentTime = 0;
      setInteractionMode('SPEAKING');
      audioPlayerRef.current.play();
    }
  };

  const handleSendText = async () => {
    if (!textInput.trim()) return;

    setIsLoading(true);
    setResponse('');
    setTranscript(`You: "${textInput}"`);
    const queryTerm = textInput;
    setTextInput('');

    try {
      setInteractionMode('PROCESSING');
      const res = await fetch(`${API_BASE}/api/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryTerm,
          language_code: selectedLanguage === 'unknown' ? 'en-IN' : selectedLanguage,
          patient_data: user?.patientProfile || "General pregnancy wellness query from text input.",
          user_phone: user?.phoneNumber || '',
          user_email: user?.email || '',
          user_name: user?.name || '',
          source: 'website'
        })
      });

      if (!res.ok) throw new Error(`Backend error: ${res.status}`);
      const data = await res.json();
      if (data.status === 'success') {
        const localizedAnswer = data.localized_answer || data.english_answer || "I'm sorry, I couldn't generate a specific answer.";
        setResponse(localizedAnswer);

        if (localizedAnswer.trim()) {
          await speakText(localizedAnswer, selectedLanguage === 'unknown' ? 'hi-IN' : selectedLanguage);
        }
      } else {
        setResponse("I'm sorry, I encountered an error while processing your request.");
        setInteractionMode('IDLE');
      }
    } catch (error) {
      console.error("Error calling RAG service:", error);
      setResponse("Could not connect to the Janani AI service.");
      setInteractionMode('IDLE');
    } finally {
      setIsLoading(false);
    }
  };

  const speakText = async (text, langCode) => {
    if (!text || !text.trim()) {
      console.warn("TTS skipped: empty text");
      return;
    }

    try {
      setInteractionMode('PROCESSING');

      let targetLang = langCode;
      const langLower = targetLang?.toLowerCase() || 'hindi';

      const langMap = {
        'marathi': 'mr-IN',
        'hindi': 'hi-IN',
        'bengali': 'bn-IN',
        'telugu': 'te-IN',
        'tamil': 'ta-IN',
        'gujarati': 'gu-IN',
        'kannada': 'kn-IN',
        'malayalam': 'ml-IN',
        'punjabi': 'pa-IN',
        'assamese': 'as-IN',
        'odia': 'or-IN',
        'sanskrit': 'sa-IN',
        'urdu': 'ur-IN',
        'mr': 'mr-IN',
        'hi': 'hi-IN',
        'bn': 'bn-IN',
        'te': 'te-IN',
        'ta': 'ta-IN',
        'gu': 'gu-IN',
        'kn': 'kn-IN',
        'ml': 'ml-IN',
        'pa': 'pa-IN',
        'as': 'as-IN',
        'or': 'or-IN',
        'ur': 'ur-IN'
      };

      if (langMap[langLower]) {
        targetLang = langMap[langLower];
      } else if (targetLang && !targetLang.includes('-')) {
        targetLang = `${targetLang}-IN`;
      }

      if (targetLang?.toLowerCase().includes('unknown')) targetLang = 'hi-IN';
      if (targetLang?.toLowerCase().includes('english')) targetLang = 'hi-IN';

      const cleanText = text.length > 500 ? text.substring(0, 497) + "..." : text;

      const response = await fetch('https://api.sarvam.ai/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': SARVAM_API_KEY
        },
        body: JSON.stringify({
          inputs: [cleanText],
          target_language_code: targetLang,
          speaker: "priya",
          model: "bulbul:v3"
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Sarvam TTS error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      if (!data.audios || !data.audios[0]) {
        throw new Error("Sarvam TTS returned success but no audio data.");
      }

      const audioBase64 = data.audios[0];
      setLastAudioBase64(audioBase64);
      audioPlayerRef.current.src = `data:audio/wav;base64,${audioBase64}`;
      setInteractionMode('SPEAKING');
      await audioPlayerRef.current.play();
    } catch (err) {
      console.error("TTS failed:", err);
      setInteractionMode('IDLE');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, sampleRate: 16000 }
      });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      audioChunksRef.current = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = processAudio;
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setInteractionMode('LISTENING');
      setTranscript('Listening carefully...');
      setResponse('');
    } catch (err) {
      console.error("Mic access denied:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
  };

  const processAudio = async () => {
    setInteractionMode('PROCESSING');
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    if (audioBlob.size < 1000) {
      setInteractionMode('IDLE');
      setTranscript('Audio too short.');
      return;
    }

    try {
      setTranscript('Transcribing...');
      const sttResult = await callSarvamSTT(audioBlob);
      const userText = sttResult.transcript;
      const langCode = sttResult.detectedLangCode;
      setDetectedLang(langCode);
      setTranscript(`You: "${userText}"`);

      const res = await fetch(`${API_BASE}/api/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userText,
          language_code: langCode,
          patient_data: user?.patientProfile || "Voice query from rural patient.",
          user_phone: user?.phoneNumber || '',
          user_email: user?.email || '',
          user_name: user?.name || '',
          source: 'website'
        })
      });
      if (!res.ok) throw new Error(`Backend error: ${res.status}`);
      const data = await res.json();

      const finalLang = data.verified_language || langCode;
      setDetectedLang(finalLang);

      const localizedAnswer = data.localized_answer || data.english_answer || "Diagnosis complete.";
      setResponse(localizedAnswer);

      if (localizedAnswer.trim()) {
        await speakText(localizedAnswer, finalLang);
      }

    } catch (error) {
      console.error("Voice processing failed:", error);
      setInteractionMode('IDLE');
    }
  };

  const callSarvamSTT = async (audioBlob) => {
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.webm');
    formData.append('model', 'saaras:v3');
    if (selectedLanguage !== 'unknown') {
      formData.append('language_code', selectedLanguage);
    }

    const res = await fetch('https://api.sarvam.ai/speech-to-text', {
      method: 'POST',
      headers: { 'api-subscription-key': SARVAM_API_KEY },
      body: formData
    });
    const data = await res.json();
    return { transcript: data.transcript, detectedLangCode: data.language_code || (selectedLanguage === 'unknown' ? 'hi-IN' : selectedLanguage) };
  };

  const handlePointerDown = (e) => {
    e.preventDefault();
    isHoldingRef.current = false;
    holdTimerRef.current = setTimeout(() => {
      isHoldingRef.current = true;
      startRecording();
    }, 400);
  };

  const handlePointerUp = (e) => {
    e.preventDefault();
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      if (isHoldingRef.current) {
        stopRecording();
      } else {
        setShowTextInput(!showTextInput);
        if (!showTextInput) {
          setTranscript('Text Mode: Typing enabled.');
        } else {
          setTranscript('');
        }
      }
      holdTimerRef.current = null;
    }
  };

  return (
    <Motion.div
      className="voice-shell"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      style={{
        marginTop: '4rem',
        padding: '3rem',
        background: 'linear-gradient(135deg, #fff 0%, #fff8f6 100%)',
        borderRadius: '30px',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--accent)',
        maxWidth: '800px',
        margin: '4rem auto 0',
        textAlign: 'center'
      }}
    >
      <p style={{ color: 'var(--text-light)', marginBottom: '1rem' }}>
        How would you like to interact with Janani?
      </p>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
        <div style={{
          background: '#f1f5f9',
          padding: '4px',
          borderRadius: '50px',
          display: 'flex',
          gap: '4px'
        }}>
          <button
            onClick={() => { setActiveInputMode('voice'); resetSession(); }}
            style={{
              padding: '0.6rem 1.5rem',
              borderRadius: '50px',
              border: 'none',
              background: activeInputMode === 'voice' ? 'white' : 'transparent',
              boxShadow: activeInputMode === 'voice' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
              color: activeInputMode === 'voice' ? 'var(--primary)' : '#64748b',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s'
            }}
          >
            <Mic size={18} /> Voice
          </button>
          <button
            onClick={() => { setActiveInputMode('text'); resetSession(); }}
            style={{
              padding: '0.6rem 1.5rem',
              borderRadius: '50px',
              border: 'none',
              background: activeInputMode === 'text' ? 'white' : 'transparent',
              boxShadow: activeInputMode === 'text' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
              color: activeInputMode === 'text' ? 'var(--primary)' : '#64748b',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s'
            }}
          >
            <MessageSquare size={18} /> Text
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2.5rem' }}>
        <div style={{
          background: 'white',
          padding: '0.75rem 1.25rem',
          borderRadius: '20px',
          border: '1px solid var(--accent)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.8rem',
          boxShadow: '0 4px 12px rgba(176, 24, 84, 0.05)',
          width: '100%',
          maxWidth: '350px'
        }}>
          <Globe size={20} color="var(--primary)" />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Language (भाषा)</span>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontWeight: '700',
                fontSize: '1.05rem',
                color: 'var(--text-dark)',
                cursor: 'pointer',
                width: '100%',
                marginTop: '2px'
              }}
            >
              {SUPPORTED_LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.native} ({lang.label})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div style={{ minHeight: '150px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {activeInputMode === 'voice' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
              style={{
                position: 'relative',
                width: '170px',
                height: '170px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto'
              }}
            >
              <AnimatePresence>
                {/* Visual moved inside orb */}
              </AnimatePresence>

              <Motion.button
                onClick={handleOrbClick}
                whileTap={{ scale: 0.92 }}
                style={{
                  width: '120px',
                  height: '120px',
                  minWidth: '120px',
                  minHeight: '120px',
                  borderRadius: '50%',
                  background: interactionMode === 'LISTENING' ? '#ef4444' : (interactionMode === 'SPEAKING' ? 'transparent' : (interactionMode === 'PROCESSING' ? 'transparent' : 'var(--primary)')),
                  border: 'none',
                  color: 'white',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  zIndex: 10,
                  boxShadow: (interactionMode === 'SPEAKING' || interactionMode === 'PROCESSING') ? 'none' : '0 10px 40px rgba(0, 0, 0, 0.1)',
                  margin: '0 auto',
                  touchAction: 'none'
                }}
              >
                {interactionMode === 'LISTENING' ? (
                  <Ear size={50} />
                ) : (interactionMode === 'SPEAKING' ? (
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '150px', height: '150px', transform: 'translateX(-12px)' }}>
                    {/* Optical alignment correction: parent translated slightly left to perfectly center over text */}
                    {/* PULSING WRAPPER (HEART + GLOW ONLY) */}
                    <Motion.div
                      animate={{ scale: [1, 1.08, 0.98, 1.04, 1] }}
                      transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut', times: [0, 0.15, 0.3, 0.45, 1] }}
                      style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '150px', height: '150px', zIndex: 1 }}
                    >
                      {/* Outer glow synchronized with the heartbeat */}
                      <Motion.div
                        animate={{ opacity: [0.3, 0.7, 0.4, 0.6, 0.3], scale: [0.95, 1.06, 0.98, 1.03, 0.95] }}
                        transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut', times: [0, 0.15, 0.3, 0.45, 1] }}
                        style={{
                          position: 'absolute',
                          width: '140%',
                          height: '140%',
                          background: 'radial-gradient(circle, rgba(183,62,93,0.25) 0%, rgba(255,255,255,0) 70%)',
                          borderRadius: '50%',
                          filter: 'blur(12px)',
                          zIndex: 0
                        }}
                      />

                      {/* Layered Hearts */}
                      <svg width="150" height="150" viewBox="0 0 100 100" style={{ position: 'relative', zIndex: 1, overflow: 'visible' }}>
                        {/* Outer Outline */}
                        <path
                          d="M50 85 C50 85, 10 55, 10 32 C10 18, 25 10, 38 18 C44 22, 50 28, 50 28 C50 28, 56 22, 62 18 C75 10, 90 18, 90 32 C90 55, 50 85, 50 85 Z"
                          fill="none"
                          stroke="rgba(183, 62, 93, 0.25)"
                          strokeWidth="5"
                          strokeLinecap="round"
                        />
                        {/* Middle Outline */}
                        <path
                          d="M50 75 C50 75, 20 50, 20 34 C20 22, 32 15, 41 22 C45 25, 50 30, 50 30 C50 30, 55 25, 59 22 C68 15, 80 22, 80 34 C80 50, 50 75, 50 75 Z"
                          fill="none"
                          stroke="rgba(183, 62, 93, 0.45)"
                          strokeWidth="6"
                          strokeLinecap="round"
                        />
                        {/* Inner Solid/Gradient Heart */}
                        <path
                          d="M50 65 C50 65, 30 45, 30 35 C30 26, 38 20, 44 25 C47 28, 50 31, 50 31 C50 31, 53 28, 56 25 C62 20, 70 26, 70 35 C70 45, 50 65, 50 65 Z"
                          fill="rgba(183, 62, 93, 0.75)"
                        />
                      </svg>
                    </Motion.div>

                    {/* STABLE WRAPPER (WAVEFORM ONLY - NO SCALE) */}
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '150px', height: '150px', zIndex: 2 }}>
                      <svg width="150" height="150" viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
                        <defs>
                          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                          </filter>
                          <clipPath id="heart-clip">
                            <path d="M50 85 C50 85, 10 55, 10 32 C10 18, 25 10, 38 18 C44 22, 50 28, 50 28 C50 28, 56 22, 62 18 C75 10, 90 18, 90 32 C90 55, 50 85, 50 85 Z" />
                          </clipPath>
                        </defs>

                        {/* Waveform Line (Translating approach inside hidden overflow) */}
                        <svg viewBox="0 0 100 100" style={{ overflow: 'hidden' }}>
                          <g clipPath="url(#heart-clip)">
                            <Motion.path
                              d="M -100 50 L -80 50 L -70 25 L -55 75 L -40 35 L -30 50 L 0 50 L 20 50 L 30 25 L 45 75 L 60 35 L 70 50 L 100 50 L 120 50 L 130 25 L 145 75 L 160 35 L 170 50 L 200 50"
                              fill="none"
                              stroke="#ffffff"
                              strokeWidth="3.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              filter="url(#glow)"
                              animate={{ x: [0, -100] }}
                              transition={{ repeat: Infinity, duration: 2.2, ease: 'linear' }}
                            />
                          </g>
                        </svg>
                      </svg>
                    </div>
                  </div>
                ) : (interactionMode === 'PROCESSING' ? (
                  <div
                    style={{
                      width: '130px',
                      height: '130px',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {/* Outer Orb Wrapper: Soft luminous glow dissolving into background */}
                    <div style={{
                      position: 'absolute',
                      inset: -10,
                      borderRadius: '50%',
                      background: 'radial-gradient(circle at 50% 40%, rgba(183, 62, 93, 0.22) 0%, rgba(183, 62, 93, 0.12) 40%, rgba(183, 62, 93, 0.04) 75%, rgba(183, 62, 93, 0) 100%)',
                      filter: 'blur(20px)',
                      pointerEvents: 'none',
                      zIndex: 0
                    }} />

                    {/* Layer 1: Base Glass Body with rich, warm pink depth */}
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '50%',
                      background: 'radial-gradient(circle at 50% 45%, rgba(255, 244, 247, 0.96) 0%, rgba(245, 208, 220, 0.86) 24%, rgba(230, 178, 194, 0.68) 55%, rgba(207, 145, 167, 0.34) 100%)',
                      backdropFilter: 'blur(12px)',
                      boxShadow: '0 10px 40px rgba(183, 62, 93, 0.35)',
                      zIndex: 1
                    }} />

                    {/* Layer 2: Main SVG (Nodes stay completely untouched here) */}
                    <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ position: 'absolute', zIndex: 2, borderRadius: '50%', overflow: 'hidden' }}>
                      <defs>
                        <filter id="ai-glow" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="1.5" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>

                      {/* Connection Lines (Subtle shimmer) */}
                      <Motion.g
                        animate={{ opacity: [0.15, 0.5, 0.15] }}
                        transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
                      >
                        <path
                          d="M50 50 L35 50 M50 50 L45 35 M50 50 L65 45 M50 50 L55 65 M50 50 L35 60 M35 60 L25 45 M45 35 L65 30 M65 45 L75 60 M35 50 L30 35 M55 65 L70 70 M45 35 L30 35 M65 45 L75 40"
                          stroke="rgba(255, 255, 255, 0.6)"
                          strokeWidth="0.8"
                          fill="none"
                        />
                      </Motion.g>

                      {/* Glowing Dots (Active Thinking Motion) */}
                      <g filter="url(#ai-glow)">
                        {[
                          { cx: 50, cy: 50, r: 3, dur: 1.6, del: 0.2, y: -5, x: 6 },
                          { cx: 35, cy: 50, r: 2.5, dur: 1.2, del: 0.8, y: 4, x: -5 },
                          { cx: 45, cy: 35, r: 2.5, dur: 1.8, del: 0.1, y: -6, x: 3 },
                          { cx: 65, cy: 45, r: 2.5, dur: 1.4, del: 0.9, y: 5, x: 4 },
                          { cx: 55, cy: 65, r: 2.5, dur: 1.9, del: 0.3, y: -4, x: -6 },
                          { cx: 35, cy: 60, r: 2.5, dur: 1.7, del: 0.5, y: 6, x: 2 },
                          { cx: 25, cy: 45, r: 2.0, dur: 1.3, del: 0.4, y: -5, x: -4 },
                          { cx: 65, cy: 30, r: 2.0, dur: 2.0, del: 1.0, y: 4, x: -2 },
                          { cx: 75, cy: 60, r: 2.0, dur: 1.5, del: 0.6, y: -6, x: 5 },
                          { cx: 30, cy: 35, r: 2.0, dur: 1.4, del: 0.7, y: 5, x: -5 },
                          { cx: 70, cy: 70, r: 2.0, dur: 1.8, del: 0.0, y: -4, x: 4 },
                          { cx: 45, cy: 75, r: 1.5, dur: 1.2, del: 0.2, y: 6, x: -3 },
                          { cx: 75, cy: 40, r: 1.5, dur: 1.9, del: 0.8, y: -5, x: 4 },
                          { cx: 20, cy: 55, r: 1.5, dur: 1.5, del: 0.3, y: 4, x: -6 },
                          { cx: 60, cy: 20, r: 1.5, dur: 1.6, del: 0.9, y: -6, x: 5 },
                          { cx: 85, cy: 50, r: 1.5, dur: 1.7, del: 0.5, y: 5, x: -4 }
                        ].map((dot, index) => (
                          <Motion.circle
                            key={index}
                            cx={dot.cx}
                            cy={dot.cy}
                            r={dot.r}
                            fill="#ffffff"
                            animate={{
                              y: [0, dot.y, 0],
                              x: [0, dot.x, 0],
                              opacity: [0.6, 1.0, 0.7],
                              scale: [1, 1.25, 1]
                            }}
                            transition={{
                              repeat: Infinity,
                              duration: dot.dur,
                              ease: 'easeInOut',
                              delay: dot.del
                            }}
                          />
                        ))}
                      </g>
                    </svg>

                    {/* Layer 3: Fog/Mist Inner Layer (NEW - ethereal atmosphere) */}
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '50%',
                      background: 'radial-gradient(circle at 50% 45%, rgba(255, 220, 230, 0.12) 0%, rgba(240, 190, 210, 0.08) 40%, rgba(230, 170, 190, 0.04) 100%)',
                      pointerEvents: 'none',
                      zIndex: 3
                    }} />

                    {/* Layer 4: Inner Shadows / Soft edge definition (no hard border) */}
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '50%',
                      boxShadow: 'inset -12px -15px 25px rgba(200, 135, 160, 0.4), inset 10px 10px 25px rgba(255, 255, 255, 0.85), inset 0 0 30px rgba(183, 62, 93, 0.15)',
                      pointerEvents: 'none',
                      zIndex: 4
                    }} />

                    {/* Layer 5: Top Glass Reflection/Glare */}
                    <div style={{
                      position: 'absolute',
                      top: '2%',
                      left: '12%',
                      right: '12%',
                      height: '45%',
                      borderRadius: '50%',
                      background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.1) 60%, rgba(255, 255, 255, 0) 100%)',
                      pointerEvents: 'none',
                      zIndex: 5
                    }} />
                  </div>
                ) : <Mic size={45} />))}
              </Motion.button>
            </div>
            <p style={{ marginTop: '1rem', fontWeight: 'bold', color: 'var(--text-light)' }}>
              {interactionMode === 'IDLE' ? 'Tap to Speak' : ''}
              {interactionMode === 'LISTENING' ? 'Listening... Tap to Stop' : ''}
              {interactionMode === 'SPEAKING' ? 'Janani Speaking...' : ''}
              {interactionMode === 'PROCESSING' ? 'Thinking...' : ''}
            </p>
          </div>
        ) : (
          <div style={{ position: 'relative', maxWidth: '500px', width: '100%', margin: '0 auto' }}>
            <input
              type="text"
              placeholder="Type your health concern here..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '1.2rem 1.5rem',
                borderRadius: '50px',
                border: '2px solid var(--accent)',
                fontSize: '1rem',
                outline: 'none',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
                opacity: isLoading ? 0.7 : 1
              }}
            />
            <button
              onClick={handleSendText}
              disabled={isLoading}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                opacity: isLoading ? 0.7 : 1
              }}
            >
              {isLoading ? (
                <Loader size={20} className="animate-spin" />
              ) : (
                <ArrowRight size={20} />
              )}
            </button>
          </div>
        )}
      </div>

      <div style={{ marginTop: '2rem', minHeight: '60px', width: '100%' }}>
        {transcript && (
          <Motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              fontStyle: 'italic',
              color: 'var(--primary)',
              fontWeight: '500',
              padding: '1rem',
              background: 'white',
              borderRadius: '12px',
              borderLeft: '4px solid var(--primary)',
              display: 'inline-block',
              maxWidth: '90%'
            }}
          >
            {transcript}
          </Motion.p>
        )}

        {detectedLang && (
          <div style={{ marginTop: '0.5rem' }}>
            <span style={{
              fontSize: '0.75rem',
              background: 'var(--accent)',
              color: 'var(--primary)',
              padding: '0.2rem 0.6rem',
              borderRadius: '20px',
              fontWeight: '600',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Globe size={12} />
              Language: {SUPPORTED_LANGUAGES.find(l => l.code === detectedLang || l.code.split('-')[0] === detectedLang.split('-')[0])?.label || detectedLang}
            </span>
          </div>
        )}
        {response && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                marginTop: '1.5rem',
                padding: '1.5rem',
                background: 'white',
                borderRadius: '24px',
                border: '1px solid var(--accent)',
                boxShadow: 'var(--shadow-md)',
                textAlign: 'left',
                position: 'relative',
                width: '100%'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem' }}>
                <Bot size={24} color="var(--primary)" />
                <strong style={{ color: 'var(--primary)' }}>Janani AI:</strong>
              </div>
              <p style={{ color: 'var(--text-dark)', lineHeight: '1.6', fontSize: '1.05rem' }}>{response}</p>
            </Motion.div>

            {lastAudioBase64 && (
              <button
                onClick={handleRepeatAudio}
                style={{
                  marginTop: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.6rem 1.2rem',
                  borderRadius: '50px',
                  background: 'white',
                  border: '1px solid var(--accent)',
                  color: 'var(--primary)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'background 0.3s'
                }}
              >
                <RotateCcw size={18} /> फिर से सुनें (Repeat)
              </button>
            )}
          </div>
        )}
      </div>
    </Motion.div>
  );
};

const MainContent = ({ assistantRef, user }) => {
  return (
    <section
      style={{
        background: 'linear-gradient(180deg, #fffaf7 0%, rgba(255, 250, 247, 0.72) 18%, rgba(255, 247, 242, 0) 100%)',
        minHeight: 'auto',
        paddingBottom: '150px',
        paddingTop: '72px'
      }}
    >
      <div className="container">
        <Element name="voice-assistant">
          <div ref={assistantRef}>
            <VoiceInterface user={user} />
          </div>
        </Element>

        <Element name="mission" style={{ marginTop: '5rem', paddingTop: '5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
            <h2 style={{ fontSize: '3rem', marginBottom: '1rem' }}>The Knowledge Foundation</h2>
            <p style={{ maxWidth: '800px', margin: '0 auto', color: 'var(--text-light)' }}>
              We use Retreival Augmented Generation (RAG) to process vast amounts of medical expertise,
              ensuring every mother gets scientifically accurate, simplified advice.
            </p>
          </div>

          <div className="mission-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2.5rem'
          }}>
            <FeatureCard
              icon={BookOpen}
              title="Expert Knowledge Base"
              desc="Fed with data from MBBS, MS, MD textbooks and pregnancy research papers for high reliability."
              delay={0.1}
            />
            <FeatureCard
              icon={Stethoscope}
              title="Risk Analysis"
              desc="Scraping specialist articles to detect high-risk symptoms and unavoidable physical circumstances."
              delay={0.2}
            />
            <FeatureCard
              icon={Activity}
              title="Daily Vital Tracking"
              desc="Voice-logged records of fetal movement, symptoms, and nutrition for holistic health monitoring."
              delay={0.3}
            />
            <FeatureCard
              icon={MessageCircle}
              title="Bhavini & Google TTS"
              desc="Leveraging Indian-language APIs for local accessibility in Hindi, Marathi, and Tamil."
              delay={0.4}
            />
            <FeatureCard
              icon={ShieldCheck}
              title="Secure RAG Pipeline"
              desc="Real-time fetching and synthesis of medical data tailored to individual patient history."
              delay={0.5}
            />
            <FeatureCard
              icon={Users}
              title="Low-Literate Friendly"
              desc="Eliminating manual text input; pure voice-powered interaction for rural accessibility."
              delay={0.6}
            />
          </div>

        </Element>
      </div>
    </section>
  );
};

const ContactModal = ({ onClose, onProceed, loading, user, selectedLanguage }) => {
  const [supportInput, setSupportInput] = useState('');
  const [supportResponse, setSupportResponse] = useState('');
  const [isSupportLoading, setIsSupportLoading] = useState(false);

  const handleSupportSend = async () => {
    if (!supportInput.trim()) return;
    setIsSupportLoading(true);
    setSupportResponse('');
    const queryTerm = supportInput;
    setSupportInput('');

    try {
      const res = await fetch(`${API_BASE}/api/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryTerm,
          language_code: selectedLanguage === 'unknown' ? 'en-IN' : selectedLanguage,
          patient_data: user?.patientProfile || "General support query from website contact modal.",
          user_phone: user?.phoneNumber || '',
          user_email: user?.email || '',
          user_name: user?.name || '',
          source: 'support_chat'
        })
      });

      if (!res.ok) throw new Error(`Backend error: ${res.status}`);
      const data = await res.json();
      if (data.status === 'success') {
        const localizedAnswer = data.localized_answer || data.english_answer;
        setSupportResponse(localizedAnswer);
      } else {
        setSupportResponse("I'm sorry, I encountered an error while processing your request.");
      }
    } catch (error) {
      console.error("Error calling RAG service for support:", error);
      setSupportResponse("Could not connect to the Janani AI service.");
    } finally {
      setIsSupportLoading(false);
    }
  };

  return (
    <Motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <Motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          padding: '2.5rem',
          borderRadius: '32px',
          maxWidth: '550px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', background: 'var(--accent)', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Users color="var(--primary)" size={24} />
            </div>
            <h2 style={{ margin: 0, color: 'var(--text-dark)', fontSize: '1.5rem' }}>Janani Support</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '20px', minHeight: '120px', maxHeight: '300px', overflowY: 'auto' }}>
          {supportResponse ? (
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Bot color="var(--primary)" size={20} style={{ flexShrink: 0, marginTop: '4px' }} />
              <div>
                <p style={{ margin: 0, color: 'var(--text-dark)', lineHeight: '1.6', fontSize: '0.95rem' }}>{supportResponse}</p>
              </div>
            </div>
          ) : isSupportLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Loader size={24} className="animate-spin" color="var(--primary)" />
              <span style={{ marginLeft: '10px', color: 'var(--primary)', fontWeight: '500' }}>Thinking...</span>
            </div>
          ) : (
            <p style={{ color: '#64748b', textAlign: 'center', margin: '2rem 0' }}>
              How can we help you today? Type your query below and Janani AI will assist you using her medical knowledge.
            </p>
          )}
        </div>

        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Describe your concern..."
            value={supportInput}
            onChange={(e) => setSupportInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSupportSend()}
            disabled={isSupportLoading}
            style={{
              width: '100%',
              padding: '1rem 3.5rem 1rem 1.5rem',
              borderRadius: '50px',
              border: '2px solid var(--accent)',
              fontSize: '1rem',
              outline: 'none'
            }}
          />
          <button
            onClick={handleSupportSend}
            disabled={isSupportLoading || !supportInput.trim()}
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              opacity: (isSupportLoading || !supportInput.trim()) ? 0.5 : 1
            }}
          >
            <ArrowRight size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
          <button
            onClick={onProceed}
            disabled={loading}
            style={{
              flex: 1,
              padding: '0.8rem',
              borderRadius: '50px',
              border: '2px solid #ef4444',
              background: 'white',
              color: '#ef4444',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.5rem',
              opacity: loading ? 0.7 : 1
            }}
          >
            <Phone size={18} />
            {loading ? 'Calling...' : 'Connect to Voice Support'}
          </button>
        </div>
      </Motion.div>
    </Motion.div>
  );
};

const Footer = ({ user }) => (
  <footer className="footer-surface" style={{ color: 'white', padding: '4rem 0' }}>
    <div className="container">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem', marginBottom: '3rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <Heart color="white" size={24} fill="white" />
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'Sora' }}>Janani</span>
          </div>
          <p style={{ opacity: 0.8, fontSize: '0.9rem' }}>
            Empowering Rural Women with RAG-Based Medical Intelligence
          </p>
        </div>
        <div>
          <h4 style={{ color: 'white', marginBottom: '1.5rem' }}>Quick Links</h4>
          <ul style={{ listStyle: 'none', opacity: 0.8 }}>
            <li style={{ marginBottom: '0.8rem', cursor: 'pointer' }} onClick={() => window.scrollToView('landing')}>About System</li>
            <li style={{ marginBottom: '0.8rem' }}>Research Base</li>
            {user && <li style={{ marginBottom: '0.8rem', cursor: 'pointer' }} onClick={() => window.scrollToView('dashboard')}>User Dashboard</li>}
            <li style={{ marginBottom: '0.8rem' }}>Terms of Care</li>
          </ul>
        </div>
        <div>
          <h4 style={{ color: 'white', marginBottom: '1.5rem' }}>Tech Stack</h4>
          <ul style={{ listStyle: 'none', opacity: 0.8 }}>
            <li style={{ marginBottom: '0.8rem' }}>Bhavini AI API</li>
            <li style={{ marginBottom: '0.8rem' }}>Google TTS</li>
            <li style={{ marginBottom: '0.8rem' }}>Hugging Face Models</li>
          </ul>
        </div>
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem', textAlign: 'center', opacity: 0.6, fontSize: '0.8rem' }}>
        © 2026 MatriCare AI. Hackathon Finalist Entry.
      </div>
    </div>
  </footer>
);


const ChatbotButton = ({ isVisible }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <ScrollLink
          to="voice-assistant"
          smooth={true}
          duration={800}
          offset={-70}
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            zIndex: 1000,
            cursor: 'pointer'
          }}
        >
          <Motion.div
            layoutId="shared-mic"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            whileHover={{ scale: 1.1, rotate: 10 }}
            whileTap={{ scale: 0.9 }}
            style={{
              width: '65px',
              height: '65px',
              borderRadius: '50%',
              background: 'var(--primary)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              boxShadow: '0 10px 30px rgba(176, 24, 84, 0.4)',
              color: 'white'
            }}
          >
            <Bot size={35} color="white" />
          </Motion.div>
        </ScrollLink>
      )}
    </AnimatePresence>
  );
};


function App() {
  const [view, setView] = useState('landing');
  const [showAuth, setShowAuth] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const assistantRef = React.useRef(null);
  const [assistantVisible, setAssistantVisible] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    window.scrollToView = (v) => {
      setView(v);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
  }, []);

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    const handleScroll = () => {
      if (assistantRef.current) {
        const rect = assistantRef.current.getBoundingClientRect();
        setAssistantVisible(rect.top < window.innerHeight * 0.6);
      }
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleTriggerCall = async () => {
    setContactLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/voice/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_email: user?.email || '',
          user_phone: user?.phoneNumber || '',
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to trigger call');
      setShowContact(false);
      showToast('Call went to the admin.', 'success');
    } catch (err) {
      console.error('Error triggering call:', err);
      showToast('Could not initiate call. Please check if the backend is running.', 'error');
    } finally {
      setContactLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <div className="App">
      <ChatbotButton isVisible={!assistantVisible} />
      <Navbar
        onAuthClick={() => setShowAuth(true)}
        user={user}
        onLogout={handleLogout}
        onContactClick={() => setShowContact(true)}
        contactLoading={contactLoading}
        setView={setView}
        currentView={view}
      />

      <AnimatePresence mode="wait">
        {view === 'landing' ? (
          <Motion.div key="landing">
            <Hero onAuthClick={() => setShowAuth(true)} user={user} setView={setView} />
            <CareSection />
            <MainContent assistantRef={assistantRef} user={user} />
          </Motion.div>
        ) : (
          <Dashboard
            key="dashboard"
            user={user}
            onBack={() => setView('landing')}
            onEmergencyCall={handleTriggerCall}
          />
        )}
      </AnimatePresence>

      <Footer user={user} />

      <AnimatePresence>
        {showAuth && (
          <Auth
            onClose={() => setShowAuth(false)}
            onAuthSuccess={(userData) => setUser(userData)}
          />
        )}
        {showContact && (
          <ContactModal
            onClose={() => setShowContact(false)}
            onProceed={handleTriggerCall}
            loading={contactLoading}
            user={user}
            selectedLanguage={view === 'landing' ? 'hi-IN' : 'en-IN'}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <div
            style={{
              position: 'fixed',
              top: '80px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 9999,
              width: 'fit-content',
              maxWidth: '90vw'
            }}
          >
            <Motion.div
              initial={{ opacity: 0, y: -60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -60 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              style={{
                background: toast.type === 'error' ? '#fef2f2' : '#f0fdf4',
                color: toast.type === 'error' ? '#dc2626' : '#16a34a',
                border: `1px solid ${toast.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
                padding: '0.8rem 1.5rem',
                borderRadius: '12px',
                fontWeight: '600',
                fontSize: '0.95rem',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                maxWidth: '90vw'
              }}
            >
              <span>{toast.type === 'error' ? '⚠' : '✓'}</span>
              {toast.message}
              <button
                onClick={() => setToast(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: '0.5rem', fontSize: '1.1rem', color: 'inherit', opacity: 0.6 }}
              >
                ×
              </button>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .hover-text-primary:hover {
          color: var(--primary) !important;
        }
      `}</style>
    </div>
  );
}


export default App;
