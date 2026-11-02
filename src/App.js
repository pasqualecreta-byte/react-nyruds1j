import React, { useState, useMemo } from 'react';
import { 
  Calendar, Clock, Users, Scissors, Plus, 
  CheckCircle2, Smartphone, 
  BarChart3, Edit3, Trash2, ListCheck, Settings, 
  Phone, MessageSquare, AlertTriangle, X, ShieldCheck, AlertCircle,
  Lock, KeyRound, LogOut
} from 'lucide-react';

const DEFAULT_SALON_INFO = {
  name: "HairCraft Pro Studio Desktop",
  subtitle: "Salone & Beauté - Cassa PC",
  address: "Via Roma 123, Milano",
  phone: "+39 02 1234567",
  welcomeMsg: "Gestione Salone Desktop Widescreen.",
  whatsappTemplate: "Ciao {NOME_CLIENTE}! Ti ricordiamo l'appuntamento per {SERVIZIO} in data {DATA} ore {ORARIO} con {STILISTA}.",
  whatsappCancelTemplate: "Gentile {NOME_CLIENTE}, purtroppo dobbiamo annullare il tuo appuntamento del {DATA} ore {ORARIO} per {SERVIZIO} ({MOTIVO})."
};

const DEFAULT_STAFF = [
  { id: '1', name: 'Marco (Titolare)', role: 'Titolare & Master Stylist', isOwner: true, allowedServiceIds: ['1', '2', '3', '4', '5'], color: 'bg-amber-500' },
  { id: '2', name: 'Sara', role: 'Colorist Specialist', isOwner: false, allowedServiceIds: ['1', '2', '3'], color: 'bg-purple-500' },
  { id: '3', name: 'Elena', role: 'Stylist & Cut', isOwner: false, allowedServiceIds: ['1', '2', '5'], color: 'bg-emerald-500' }
];

const INITIAL_SERVICES = [
  { id: '1', name: 'Taglio Uomo / Donna', category: 'Taglio', duration: 30, ownerOnly: false },
  { id: '2', name: 'Piega & Style', category: 'Piega', duration: 30, ownerOnly: false },
  { id: '3', name: 'Colore & Rifiuto Cromatico', category: 'Colore', duration: 60, ownerOnly: false },
  { id: '4', name: 'Balayage & Schiariture Avanzate', category: 'Colore Avanzato', duration: 120, ownerOnly: true },
  { id: '5', name: 'Trattamento Ristrutturante Keratina', category: 'Trattamento', duration: 45, ownerOnly: false }
];

const INITIAL_APPOINTMENTS = [
  { id: 'appt_1', clientName: 'Giulia Bianchi', phone: '+393401234567', serviceId: '4', staffId: '1', date: '2026-11-02', time: '10:00', status: 'confermato', whatsappSent: false },
  { id: 'appt_2', clientName: 'Andrea Rossi', phone: '+393339876543', serviceId: '1', staffId: '2', date: '2026-11-02', time: '10:00', status: 'confermato', whatsappSent: true }
];

const INITIAL_CLIENTS = [
  { id: 'cli_1', name: 'Giulia Bianchi', phone: '+393401234567', email: 'giulia@example.com', notes: 'Sensibile a trattamenti ammoniacali' },
  { id: 'cli_2', name: 'Andrea Rossi', phone: '+393339876543', email: 'andrea@example.com', notes: 'Preferisce piega naturale' }
];

const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

const formatDateIt = (dateIso) => {
  if (!dateIso) return '';
  const [y, m, d] = dateIso.split('-');
  return `${d}/${m}/${y.slice(2)}`;
};

export default function AppPC() {
  // Authentication State (PIN personalizzabile)
  const [salonPin, setSalonPin] = useState(() => {
    return localStorage.getItem('hc_salon_pin') || '1234';
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [accessRole, setAccessRole] = useState('salon'); // 'salon' or 'client_only'

  // Stato per la modifica del PIN nelle Impostazioni
  const [pinForm, setPinForm] = useState({ currentPin: '', newPin: '', confirmPin: '' });
  const [pinChangeMsg, setPinChangeMsg] = useState({ type: '', text: '' });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [salonInfo, setSalonInfo] = useState(DEFAULT_SALON_INFO);
  const [staffList, setStaffList] = useState(DEFAULT_STAFF);
  const [services, setServices] = useState(INITIAL_SERVICES);
  const [appointments, setAppointments] = useState(INITIAL_APPOINTMENTS);
  const [clients, setClients] = useState(INITIAL_CLIENTS);
  const [selectedDate, setSelectedDate] = useState('2026-11-02');
  
  // Modals state
  const [isApptModalOpen, setIsApptModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  const [editingService, setEditingService] = useState(null);
  const [serviceForm, setServiceForm] = useState({ name: '', duration: '30', category: 'Taglio', ownerOnly: false });

  const [editingStaff, setEditingStaff] = useState(null);
  const [staffForm, setStaffForm] = useState({ name: '', role: '', isOwner: false, allowedServiceIds: [] });

  const [newClient, setNewClient] = useState({ name: '', phone: '', email: '', notes: '' });
  const [bookingError, setBookingError] = useState('');

  const [newAppt, setNewAppt] = useState({
    clientName: '',
    phone: '',
    serviceId: '1',
    staffId: '1',
    date: '2026-11-02',
    time: '10:00'
  });

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (enteredPin === salonPin) {
      setIsAuthenticated(true);
      setPinError(false);
      setEnteredPin('');
    } else {
      setPinError(true);
    }
  };

  const handleChangePinSubmit = (e) => {
    e.preventDefault();
    setPinChangeMsg({ type: '', text: '' });

    if (pinForm.currentPin !== salonPin) {
      setPinChangeMsg({ type: 'error', text: 'Il PIN attuale inserito non è corretto.' });
      return;
    }
    if (!pinForm.newPin || pinForm.newPin.length < 4) {
      setPinChangeMsg({ type: 'error', text: 'Il nuovo PIN deve contenere almeno 4 cifre.' });
      return;
    }
    if (pinForm.newPin !== pinForm.confirmPin) {
      setPinChangeMsg({ type: 'error', text: 'I due nuovi PIN digitati non coincidono.' });
      return;
    }

    setSalonPin(pinForm.newPin);
    localStorage.setItem('hc_salon_pin', pinForm.newPin);
    setPinForm({ currentPin: '', newPin: '', confirmPin: '' });
    setPinChangeMsg({ type: 'success', text: 'PIN aggiornato con successo! Utilizza il nuovo PIN al prossimo accesso.' });
  };

  const thirtyDaysList = useMemo(() => {
    const days = [];
    const base = new Date(selectedDate || '2026-11-02');
    for (let i = 0; i < 30; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const isoStr = d.toISOString().split('T')[0];
      days.push({ 
        dateStr: isoStr, 
        dayName: d.toLocaleDateString('it-IT', { weekday: 'short' }), 
        dayNum: d.getDate(), 
        monthName: d.toLocaleDateString('it-IT', { month: 'short' }) 
      });
    }
    return days;
  }, [selectedDate]);

  const salonTimeSlots = useMemo(() => {
    const slots = [];
    for (let h = 9; h < 19; h++) {
      slots.push(`${String(h).padStart(2, '0')}:00`);
      slots.push(`${String(h).padStart(2, '0')}:15`);
      slots.push(`${String(h).padStart(2, '0')}:30`);
      slots.push(`${String(h).padStart(2, '0')}:45`);
    }
    slots.push('19:00');
    return slots;
  }, []);

  const availableServicesForStaff = useMemo(() => {
    const selectedStaff = staffList.find(st => st.id === newAppt.staffId);
    if (!selectedStaff) return services;
    return services.filter(s => {
      if (s.ownerOnly && !selectedStaff.isOwner) return false;
      return selectedStaff.allowedServiceIds?.includes(s.id);
    });
  }, [newAppt.staffId, staffList, services]);

  const handleAddAppointment = (e) => {
    e.preventDefault();
    if (!newAppt.clientName || !newAppt.phone) return;
    const created = { ...newAppt, id: 'appt_' + Date.now().toString(), status: 'confermato', whatsappSent: false };
    setAppointments(prev => [...prev, created]);
    if (!clients.some(c => c.name.toLowerCase() === newAppt.clientName.toLowerCase())) {
      setClients(prev => [...prev, { id: 'cli_' + Date.now().toString(), name: newAppt.clientName, phone: newAppt.phone, email: '', notes: '' }]);
    }
    setIsApptModalOpen(false);
  };

  const handleSaveService = (e) => {
    e.preventDefault();
    if (!serviceForm.name || !serviceForm.duration) return;
    const durationNum = parseInt(serviceForm.duration, 10);
    if (editingService) {
      setServices(services.map(s => s.id === editingService.id ? { ...s, ...serviceForm, duration: durationNum } : s));
    } else {
      setServices([...services, { id: Date.now().toString(), ...serviceForm, duration: durationNum }]);
    }
    setIsServiceModalOpen(false);
  };

  const handleSaveStaff = (e) => {
    e.preventDefault();
    if (!staffForm.name) return;
    if (editingStaff) {
      setStaffList(staffList.map(st => st.id === editingStaff.id ? { ...st, ...staffForm } : st));
    } else {
      setStaffList([...staffList, { id: Date.now().toString(), ...staffForm, color: 'bg-amber-500' }]);
    }
    setIsStaffModalOpen(false);
  };

  const handleAddClient = (e) => {
    e.preventDefault();
    if (!newClient.name || !newClient.phone) return;
    setClients([...clients, { ...newClient, id: 'cli_' + Date.now().toString() }]);
    setNewClient({ name: '', phone: '', email: '', notes: '' });
    setIsClientModalOpen(false);
  };

  // SCHERMATA DI LOGIN / SELEZIONE ACCESSO RISERVATO
  if (!isAuthenticated && accessRole === 'salon') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans text-slate-100">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-md w-full space-y-6 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="inline-flex p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400 mb-2">
              <Lock className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-white">{salonInfo.name}</h1>
            <p className="text-xs text-slate-400">Inserisci il PIN di sicurezza per accedere alla Cassa & Agenda</p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-2 text-center">PIN DI ACCESSO SALONE</label>
              <input
                type="password"
                placeholder="••••"
                value={enteredPin}
                onChange={e => setEnteredPin(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-center text-3xl font-mono tracking-widest p-4 rounded-2xl text-amber-400 focus:outline-none focus:border-amber-500"
                autoFocus
              />
            </div>

            {pinError && (
              <p className="text-xs text-red-400 text-center font-bold bg-red-500/10 p-2 rounded-xl border border-red-500/20">
                PIN Errato! Riprova
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3.5 rounded-2xl text-sm transition shadow-lg shadow-amber-500/20"
            >
              Sblocca Gestionale
            </button>
          </form>

          <div className="pt-4 border-t border-slate-800/80 text-center">
            <button
              onClick={() => setAccessRole('client_only')}
              className="text-xs text-amber-400 hover:underline flex items-center justify-center space-x-1 mx-auto"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Simula Vista Cliente (Senza Password)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SCHERMATA SOLO PORTALE PUBBLICO CLIENTE
  if (accessRole === 'client_only') {
    return (
      <div className="min-h-screen bg-slate-950 p-6 font-sans text-slate-100 flex flex-col items-center justify-center">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-lg w-full space-y-6 shadow-2xl">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <div>
              <h2 className="font-bold text-xl text-white">{salonInfo.name}</h2>
              <p className="text-xs text-amber-400">Portale Prenotazioni Online Cliente</p>
            </div>
            <button 
              onClick={() => setAccessRole('salon')}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-xl flex items-center space-x-1"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Area Salone</span>
            </button>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); alert("Prenotazione inviata! Riceverai una conferma via WhatsApp."); }} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Seleziona Servizio</label>
              <select className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs text-white">
                {services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.duration} min)</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="Tuo Nome e Cognome *" required className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs text-white" />
              <input type="tel" placeholder="Tuo WhatsApp *" required className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs text-white" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs text-white" />
              <select className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs text-white font-mono">
                {salonTimeSlots.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <button type="submit" className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3.5 rounded-xl text-sm transition shadow-lg shadow-amber-500/20">
              Invia Prenotazione al Salone
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      {/* FIXED DESKTOP SIDEBAR */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col justify-between h-screen sticky top-0 shrink-0">
        <div>
          <div className="flex items-center space-x-3 mb-8">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400">
              <Scissors className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-base text-white">{salonInfo.name}</h1>
              <p className="text-xs text-amber-400 font-medium">Postazione Cassa PC</p>
            </div>
          </div>

          <nav className="space-y-2">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'calendar', label: 'Agenda Giornaliera', icon: Calendar },
              { id: 'month-view', label: 'Vista 30 Giorni', icon: Calendar },
              { id: 'services', label: 'Prestazioni & Durate', icon: ListCheck },
              { id: 'staff', label: 'Team & Competenze', icon: Users },
              { id: 'clients', label: 'Anagrafica Clienti', icon: Users },
              { id: 'settings', label: 'Impostazioni Salone', icon: Settings }
            ].map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm transition ${
                    activeTab === item.id ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="space-y-3">
          <button 
            onClick={() => setIsAuthenticated(false)}
            className="w-full flex items-center justify-center space-x-2 bg-slate-950 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-500/30 p-3 rounded-xl text-xs font-bold transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Blocca Schermo PIN</span>
          </button>
          
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-slate-400 text-center">
            Acceso come: <span className="text-white font-bold">Cassa Titolare</span>
          </div>
        </div>
      </aside>

      {/* MAIN DESKTOP CONTENT */}
      <main className="flex-1 p-8 space-y-6 overflow-y-auto">
        <div className="flex justify-between items-center border-b border-slate-800 pb-5">
          <div>
            <h2 className="text-3xl font-bold text-white">Postazione Salone PC</h2>
            <p className="text-slate-400 text-sm">Pianificazione coordinata del team e appuntamenti in tempo reale</p>
          </div>

          <div className="flex items-center space-x-3">
            <input 
              type="date" 
              value={selectedDate} 
              onChange={e => setSelectedDate(e.target.value)} 
              className="bg-slate-900 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm"
            />
            <button 
              onClick={() => { setBookingError(''); setIsApptModalOpen(true); }}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl flex items-center space-x-2 text-sm shadow-lg shadow-amber-500/10"
            >
              <Plus className="w-5 h-5" />
              <span>Nuovo Appuntamento</span>
            </button>
          </div>
        </div>

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <p className="text-xs text-slate-400 uppercase font-bold">Appuntamenti del Giorno</p>
                <p className="text-3xl font-bold text-white mt-1">{appointments.filter(a => a.date === selectedDate).length}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <p className="text-xs text-slate-400 uppercase font-bold">Collaboratori In Servizio</p>
                <p className="text-3xl font-bold text-amber-400 mt-1">{staffList.length}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <p className="text-xs text-slate-400 uppercase font-bold">Clienti Registrati</p>
                <p className="text-3xl font-bold text-emerald-400 mt-1">{clients.length}</p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-xl text-white">Appuntamenti Programmati</h3>
              <div className="space-y-3">
                {appointments.filter(a => a.date === selectedDate).map(a => {
                  const svc = services.find(s => s.id === a.serviceId);
                  const st = staffList.find(s => s.id === a.staffId);
                  return (
                    <div key={a.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex justify-between items-center">
                      <div>
                        <span className="font-mono font-bold text-amber-400 text-sm">{a.time}</span>
                        <h4 className="font-bold text-white text-base mt-1">{a.clientName} ({a.phone})</h4>
                        <p className="text-xs text-slate-400">{svc?.name} - Stylist: <span className="text-slate-200">{st?.name}</span></p>
                      </div>
                      <button 
                        onClick={() => setAppointments(appointments.filter(item => item.id !== a.id))}
                        className="text-red-400 hover:text-red-300 p-2"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* AGENDA GIORNALIERA TAB */}
        {activeTab === 'calendar' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-xl text-white flex items-center space-x-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <span>Timeline Giornaliera (15 Minuti): {formatDateIt(selectedDate)}</span>
            </h3>

            <div className="space-y-2">
              {salonTimeSlots.map(slotTime => {
                const slotAppts = appointments.filter(a => a.date === selectedDate && a.time === slotTime);
                return (
                  <div key={slotTime} className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
                    <span className="font-mono font-bold text-amber-400 text-sm">{slotTime}</span>
                    <div className="flex-1 mx-4">
                      {slotAppts.length > 0 ? (
                        <div className="flex gap-2 flex-wrap">
                          {slotAppts.map(a => {
                            const st = staffList.find(s => s.id === a.staffId);
                            const svc = services.find(s => s.id === a.serviceId);
                            return (
                              <span key={a.id} className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs px-3 py-1 rounded-lg font-bold">
                                {a.clientName} ({svc?.name}) - {st?.name}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-600 italic">Disponibile</span>
                      )}
                    </div>
                    <button 
                      onClick={() => { setNewAppt(prev => ({ ...prev, date: selectedDate, time: slotTime })); setIsApptModalOpen(true); }}
                      className="bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 font-bold text-xs px-3 py-1.5 rounded-lg border border-amber-500/30"
                    >
                      + Prenota ({slotTime})
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VISTA 30 GIORNI TAB */}
        {activeTab === 'month-view' && (
          <div className="space-y-4">
            <h3 className="font-bold text-xl text-white">Griglia Prossimi 30 Giorni</h3>
            <div className="grid grid-cols-6 gap-3">
              {thirtyDaysList.map(day => {
                const dayAppts = appointments.filter(a => a.date === day.dateStr);
                return (
                  <div 
                    key={day.dateStr}
                    onClick={() => { setSelectedDate(day.dateStr); setNewAppt(prev => ({ ...prev, date: day.dateStr })); setIsApptModalOpen(true); }}
                    className="bg-slate-900 border border-slate-800 hover:border-amber-500 p-4 rounded-2xl cursor-pointer transition space-y-2"
                  >
                    <span className="text-xs text-slate-400 uppercase font-bold">{day.dayName}</span>
                    <p className="text-xl font-bold text-white">{day.dayNum} {day.monthName}</p>
                    <div className="bg-slate-950 border border-slate-800 p-2 rounded-xl text-xs text-amber-400 font-bold text-center">
                      {dayAppts.length} appuntamenti
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PRESTAZIONI TAB */}
        {activeTab === 'services' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-xl text-white">Prestazioni e Durate</h3>
              <button 
                onClick={() => { setEditingService(null); setServiceForm({ name: '', duration: '30', category: 'Taglio', ownerOnly: false }); setIsServiceModalOpen(true); }}
                className="bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-sm"
              >
                + Nuova Prestazione
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {services.map(s => (
                <div key={s.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-white text-base">{s.name}</h4>
                    <p className="text-xs text-slate-400 mt-1">Durata: <span className="text-amber-400 font-bold">{s.duration} minuti</span></p>
                    {s.ownerOnly && <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold mt-1 inline-block">Solo Titolare</span>}
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => { setEditingService(s); setServiceForm({ name: s.name, duration: s.duration.toString(), category: s.category || 'Taglio', ownerOnly: !!s.ownerOnly }); setIsServiceModalOpen(true); }} className="text-slate-400 hover:text-white p-2">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setServices(services.filter(item => item.id !== s.id))} className="text-red-400 p-2">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TEAM TAB */}
        {activeTab === 'staff' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-xl text-white">Team Salone & Abilitazioni</h3>
              <button 
                onClick={() => { setEditingStaff(null); setStaffForm({ name: '', role: '', isOwner: false, allowedServiceIds: services.map(s => s.id) }); setIsStaffModalOpen(true); }}
                className="bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-sm"
              >
                + Nuovo Collaboratore
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {staffList.map(st => (
                <div key={st.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-white text-lg">{st.name}</h4>
                      <p className="text-xs text-slate-400">{st.role}</p>
                    </div>
                    {st.isOwner && <span className="text-xs bg-amber-500/20 text-amber-400 px-2.5 py-1 rounded-full font-bold">Titolare</span>}
                  </div>
                  <div className="flex flex-wrap gap-1.5 border-t border-slate-800 pt-3">
                    {services.filter(s => st.allowedServiceIds?.includes(s.id)).map(s => (
                      <span key={s.id} className="text-[11px] bg-slate-950 border border-slate-800 text-slate-300 px-2 py-1 rounded-lg">
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CLIENTI TAB */}
        {activeTab === 'clients' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-xl text-white">Anagrafica Clienti</h3>
              <button onClick={() => setIsClientModalOpen(true)} className="bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-sm">
                + Nuovo Cliente
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {clients.map(c => (
                <div key={c.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
                  <h4 className="font-bold text-white text-base">{c.name}</h4>
                  <p className="text-xs text-slate-400">{c.phone}</p>
                  {c.notes && <p className="text-xs text-amber-400/80 bg-amber-500/10 p-2 rounded-lg mt-2">{c.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* IMPOSTAZIONI TAB */}
        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-2xl">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-xl text-white">Dati Generali Salone</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Nome Salone</label>
                  <input type="text" value={salonInfo.name} onChange={e => setSalonInfo({...salonInfo, name: e.target.value})} className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-sm text-white" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Telefono</label>
                  <input type="text" value={salonInfo.phone} onChange={e => setSalonInfo({...salonInfo, phone: e.target.value})} className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-sm text-white" />
                </div>
              </div>
            </div>

            {/* SEZIONE CAMBIO PIN */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center space-x-2 text-amber-400">
                <KeyRound className="w-5 h-5" />
                <h3 className="font-bold text-xl text-white">Modifica PIN di Sicurezza</h3>
              </div>
              <p className="text-xs text-slate-400">
                Puoi modificare il PIN di accesso e allungare la sequenza di cifre a tuo piacimento.
              </p>

              <form onSubmit={handleChangePinSubmit} className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">PIN Attuale *</label>
                  <input 
                    type="password" 
                    placeholder="Inserisci il PIN in uso..." 
                    value={pinForm.currentPin} 
                    onChange={e => setPinForm({ ...pinForm, currentPin: e.target.value })} 
                    className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-sm text-white font-mono" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Nuovo PIN *</label>
                    <input 
                      type="password" 
                      placeholder="Nuovo PIN (min. 4 cifre)" 
                      value={pinForm.newPin} 
                      onChange={e => setPinForm({ ...pinForm, newPin: e.target.value })} 
                      className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-sm text-white font-mono" 
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Conferma Nuovo PIN *</label>
                    <input 
                      type="password" 
                      placeholder="Ripeti il nuovo PIN..." 
                      value={pinForm.confirmPin} 
                      onChange={e => setPinForm({ ...pinForm, confirmPin: e.target.value })} 
                      className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-sm text-white font-mono" 
                    />
                  </div>
                </div>

                {pinChangeMsg.text && (
                  <p className={`text-xs p-3 rounded-xl font-bold border ${
                    pinChangeMsg.type === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {pinChangeMsg.text}
                  </p>
                )}

                <button 
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-sm transition shadow-lg shadow-amber-500/20"
                >
                  Aggiorna PIN Salone
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* MODAL NUOVA PRENOTAZIONE PC */}
      {isApptModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-lg text-white">Nuovo Appuntamento PC ({formatDateIt(newAppt.date)})</h3>
                <p className="text-xs text-amber-400 font-medium">Controlla la timeline del giorno prima di salvare</p>
              </div>
              <button onClick={() => setIsApptModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Timeline Occupazione del {formatDateIt(newAppt.date)}:</span>
                </span>
                <span className="text-[10px] text-amber-400">Clicca su un orario per selezionarlo</span>
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-thin">
                {salonTimeSlots.map(slotTime => {
                  const occupiedAppts = appointments.filter(a => a.date === newAppt.date && a.time === slotTime && a.status !== 'annullato');
                  const isSelected = newAppt.time === slotTime;
                  const isBusy = occupiedAppts.length >= staffList.length;

                  return (
                    <button
                      key={slotTime}
                      type="button"
                      onClick={() => setNewAppt(prev => ({ ...prev, time: slotTime }))}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs flex flex-col items-center shrink-0 transition ${
                        isSelected 
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow' 
                          : isBusy 
                            ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                            : occupiedAppts.length > 0 
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' 
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span className="font-mono font-bold">{slotTime}</span>
                      <span className="text-[9px] opacity-80">
                        {isBusy ? 'Occupato' : occupiedAppts.length > 0 ? `${occupiedAppts.length} pren.` : 'Libero'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleAddAppointment} className="space-y-4">
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                  <label className="text-xs font-bold text-white">Seleziona / Modifica Data:</label>
                </div>
                <input 
                  type="date" 
                  value={newAppt.date} 
                  onChange={e => {
                    const newDate = e.target.value;
                    setSelectedDate(newDate);
                    setNewAppt(prev => ({ ...prev, date: newDate }));
                  }} 
                  className="bg-slate-900 border border-slate-700 p-2 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-amber-500" 
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Seleziona Cliente</label>
                <select 
                  onChange={e => {
                    const c = clients.find(cl => cl.name === e.target.value);
                    if (c) setNewAppt({ ...newAppt, clientName: c.name, phone: c.phone });
                  }} 
                  className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs text-white mb-2"
                >
                  <option value="">-- Seleziona da Anagrafica --</option>
                  {clients.map(c => <option key={c.id} value={c.name}>{c.name} ({c.phone})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Nome Cliente *" required value={newAppt.clientName} onChange={e => setNewAppt({...newAppt, clientName: e.target.value})} className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-sm text-white" />
                <input type="tel" placeholder="WhatsApp *" required value={newAppt.phone} onChange={e => setNewAppt({...newAppt, phone: e.target.value})} className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-sm text-white" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <select value={newAppt.staffId} onChange={e => setNewAppt({...newAppt, staffId: e.target.value})} className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs text-white">
                  {staffList.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
                </select>
                <select value={newAppt.serviceId} onChange={e => setNewAppt({...newAppt, serviceId: e.target.value})} className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs text-white">
                  {availableServicesForStaff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.duration}m)</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 mb-1 block">Data Appuntamento</label>
                  <input type="date" value={newAppt.date} onChange={e => { setSelectedDate(e.target.value); setNewAppt({ ...newAppt, date: e.target.value }); }} className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white" />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 mb-1 block">Orario Selezionato</label>
                  <input type="time" value={newAppt.time} onChange={e => setNewAppt({ ...newAppt, time: e.target.value })} className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-white font-mono font-bold" />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button type="button" onClick={() => setIsApptModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-sm">Annulla</button>
                <button type="submit" className="px-5 py-2.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-sm">Salva Appuntamento</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SERVIZIO PC */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-lg text-white">{editingService ? 'Modifica Servizio' : 'Nuovo Servizio'}</h3>
            <form onSubmit={handleSaveService} className="space-y-4">
              <input type="text" placeholder="Nome Servizio *" required value={serviceForm.name} onChange={e => setServiceForm({...serviceForm, name: e.target.value})} className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-sm text-white" />
              <input type="number" placeholder="Durata (minuti) *" required value={serviceForm.duration} onChange={e => setServiceForm({...serviceForm, duration: e.target.value})} className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-sm text-white" />
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setIsServiceModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-sm">Annulla</button>
                <button type="submit" className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-sm">Salva</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL STAFF PC */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-lg text-white">{editingStaff ? 'Modifica Stilista' : 'Nuovo Stilista'}</h3>
            <form onSubmit={handleSaveStaff} className="space-y-4">
              <input type="text" placeholder="Nome *" required value={staffForm.name} onChange={e => setStaffForm({...staffForm, name: e.target.value})} className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-sm text-white" />
              <input type="text" placeholder="Ruolo" value={staffForm.role} onChange={e => setStaffForm({...staffForm, role: e.target.value})} className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-sm text-white" />
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setIsStaffModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-sm">Annulla</button>
                <button type="submit" className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-sm">Salva</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CLIENTE PC */}
      {isClientModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-lg text-white">Nuovo Cliente</h3>
            <form onSubmit={handleAddClient} className="space-y-4">
              <input type="text" placeholder="Nome *" required value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-sm text-white" />
              <input type="tel" placeholder="Telefono *" required value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})} className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-sm text-white" />
              <textarea placeholder="Note..." value={newClient.notes} onChange={e => setNewClient({...newClient, notes: e.target.value})} className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-sm text-white" />
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setIsClientModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-sm">Annulla</button>
                <button type="submit" className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-sm">Salva</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}