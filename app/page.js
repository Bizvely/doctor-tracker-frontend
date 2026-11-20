'use client';

import { useState, useEffect } from 'react';

const API_BASE = 'https://doctor-tracker-backend-os6n.onrender.com/api';

export default function DoctorTrackerDashboard() {
  const [stats, setStats] = useState({ totalDoctors: 0, availableDoctors: 0, totalPatients: 0, waitingPatients: 0 });
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  
  // Auth States
  const [user, setUser] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });

  // Form States
  const [docForm, setDocForm] = useState({ name: '', specialty: '', hospital: '', phone: '', schedule: '', fee: 500 });
  const [patForm, setPatForm] = useState({ patientName: '', age: '', phone: '', appointmentDate: new Date().toISOString().split('T')[0], assignedDoctor: '', notes: '' });

  useEffect(() => {
    const savedUser = localStorage.getItem('cg_user');
    if (savedUser) setUser(JSON.parse(savedUser));
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [statsRes, docRes, patRes] = await Promise.all([
        fetch(`${API_BASE}/stats`),
        fetch(`${API_BASE}/doctors`),
        fetch(`${API_BASE}/patients`)
      ]);
      setStats(await statsRes.json());
      setDoctors(await docRes.json());
      setPatients(await patRes.json());
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  // Auth Handler
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isRegisterMode ? '/auth/register' : '/auth/login';
    const payload = isRegisterMode ? { ...authForm, role: 'admin' } : { email: authForm.email, password: authForm.password };

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) return alert(data.message || 'Auth failed');

      if (isRegisterMode) {
        alert('Registration successful! Please login.');
        setIsRegisterMode(false);
      } else {
        localStorage.setItem('cg_token', data.token);
        localStorage.setItem('cg_user', JSON.stringify(data.user));
        setUser(data.user);
        setIsAuthOpen(false);
        alert(`Welcome back, ${data.user.name}!`);
      }
    } catch (err) {
      alert('Server wake-up in progress. Try again.');
    }
  };

  const logout = () => {
    localStorage.removeItem('cg_token');
    localStorage.removeItem('cg_user');
    setUser(null);
    alert('Logged out.');
  };

  // Doctor Actions
  const handleAddDoctor = async (e) => {
    e.preventDefault();
    await fetch(`${API_BASE}/doctors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(docForm)
    });
    setDocForm({ name: '', specialty: '', hospital: '', phone: '', schedule: '', fee: 500 });
    loadAllData();
  };

  const updateDocStatus = async (id, status) => {
    await fetch(`${API_BASE}/doctors/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    loadAllData();
  };

  const deleteDoctor = async (id) => {
    if (!confirm('Delete doctor?')) return;
    await fetch(`${API_BASE}/doctors/${id}`, { method: 'DELETE' });
    loadAllData();
  };

  // Patient Actions
  const handleAddPatient = async (e) => {
    e.preventDefault();
    await fetch(`${API_BASE}/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patForm)
    });
    setPatForm({ patientName: '', age: '', phone: '', appointmentDate: new Date().toISOString().split('T')[0], assignedDoctor: '', notes: '' });
    loadAllData();
  };

  const updatePatStatus = async (id, status) => {
    await fetch(`${API_BASE}/patients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    loadAllData();
  };

  const deletePatient = async (id) => {
    if (!confirm('Delete patient?')) return;
    await fetch(`${API_BASE}/patients/${id}`, { method: 'DELETE' });
    loadAllData();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Navbar */}
      <nav className="bg-[#0B192C] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-[#36D5F4] flex items-center justify-center text-[#0B192C] font-bold text-xl">C</div>
            <div>
              <span className="font-bold text-lg tracking-tight">Care Guide BD</span>
              <span className="hidden sm:inline-block text-xs text-[#36D5F4] ml-2 px-2 py-0.5 rounded bg-slate-800">Next.js Dashboard</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-sm text-slate-300">Hi, {user.name}</span>
                <button onClick={logout} className="bg-rose-500 hover:bg-rose-600 text-white font-medium px-3 py-1.5 rounded-lg text-sm transition">Logout</button>
              </>
            ) : (
              <button onClick={() => setIsAuthOpen(true)} className="bg-[#36D5F4] hover:bg-cyan-400 text-[#0B192C] font-semibold px-4 py-1.5 rounded-lg text-sm transition">Staff Login</button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Banner */}
        <div className="mb-6 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
          <span>● Connected to Live API: <strong>doctor-tracker-backend-os6n.onrender.com</strong></span>
          <button onClick={loadAllData} className="text-xs font-semibold underline hover:text-emerald-950">Refresh Data</button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <p className="text-xs font-medium text-slate-500 uppercase">Total Doctors</p>
            <p className="text-2xl font-bold text-[#111B43] mt-1">{stats.totalDoctors || 0}</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <p className="text-xs font-medium text-slate-500 uppercase">Available Now</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.availableDoctors || 0}</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <p className="text-xs font-medium text-slate-500 uppercase">Total Patients</p>
            <p className="text-2xl font-bold text-[#111B43] mt-1">{stats.totalPatients || 0}</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <p className="text-xs font-medium text-slate-500 uppercase">Waiting Queue</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{stats.waitingPatients || 0}</p>
          </div>
        </div>

        {/* Management Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Doctors Section */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold text-[#111B43] mb-4">Add New Doctor</h2>
              <form onSubmit={handleAddDoctor} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input type="text" placeholder="Doctor Name" value={docForm.name} onChange={e => setDocForm({...docForm, name: e.target.value})} required className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#36D5F4]" />
                <input type="text" placeholder="Specialty" value={docForm.specialty} onChange={e => setDocForm({...docForm, specialty: e.target.value})} required className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#36D5F4]" />
                <input type="text" placeholder="Hospital Name" value={docForm.hospital} onChange={e => setDocForm({...docForm, hospital: e.target.value})} required className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#36D5F4]" />
                <input type="text" placeholder="Phone" value={docForm.phone} onChange={e => setDocForm({...docForm, phone: e.target.value})} required className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#36D5F4]" />
                <input type="text" placeholder="Schedule" value={docForm.schedule} onChange={e => setDocForm({...docForm, schedule: e.target.value})} required className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#36D5F4]" />
                <input type="number" placeholder="Fee (BDT)" value={docForm.fee} onChange={e => setDocForm({...docForm, fee: Number(e.target.value)})} required className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#36D5F4]" />
                <button type="submit" className="sm:col-span-2 bg-[#111B43] hover:bg-slate-800 text-white font-medium py-2 rounded-lg text-sm transition">+ Register Doctor</button>
              </form>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold text-[#111B43] mb-4">Doctor Directory</h2>
              <div className="space-y-3">
                {doctors.length === 0 ? <p className="text-sm text-slate-400">No doctors found.</p> : 
                  doctors.map(doc => (
                    <div key={doc._id} className="p-4 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-slate-900 text-sm">{doc.name}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${doc.status === 'Available' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{doc.status}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">{doc.specialty} • {doc.hospital}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <select value={doc.status} onChange={e => updateDocStatus(doc._id, e.target.value)} className="text-xs border border-slate-300 rounded px-2 py-1 bg-white">
                          <option value="Available">Available</option>
                          <option value="Busy">Busy</option>
                          <option value="On Leave">On Leave</option>
                        </select>
                        <button onClick={() => deleteDoctor(doc._id)} className="text-xs text-rose-600 hover:underline px-1">Delete</button>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>

          {/* Patients Section */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold text-[#111B43] mb-4">Assign Patient</h2>
              <form onSubmit={handleAddPatient} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input type="text" placeholder="Patient Name" value={patForm.patientName} onChange={e => setPatForm({...patForm, patientName: e.target.value})} required className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#36D5F4]" />
                <input type="number" placeholder="Age" value={patForm.age} onChange={e => setPatForm({...patForm, age: Number(e.target.value)})} required className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#36D5F4]" />
                <input type="text" placeholder="Phone" value={patForm.phone} onChange={e => setPatForm({...patForm, phone: e.target.value})} required className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#36D5F4]" />
                <input type="date" value={patForm.appointmentDate} onChange={e => setPatForm({...patForm, appointmentDate: e.target.value})} required className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#36D5F4]" />
                <select value={patForm.assignedDoctor} onChange={e => setPatForm({...patForm, assignedDoctor: e.target.value})} required className="sm:col-span-2 border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="">-- Select Doctor --</option>
                  {doctors.map(d => <option key={d._id} value={d._id}>{d.name} ({d.specialty})</option>)}
                </select>
                <input type="text" placeholder="Notes / Symptoms" value={patForm.notes} onChange={e => setPatForm({...patForm, notes: e.target.value})} className="sm:col-span-2 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#36D5F4]" />
                <button type="submit" className="sm:col-span-2 bg-[#8B5CF6] hover:bg-violet-700 text-white font-medium py-2 rounded-lg text-sm transition">+ Book & Track</button>
              </form>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold text-[#111B43] mb-4">Patient Queue</h2>
              <div className="space-y-3">
                {patients.length === 0 ? <p className="text-sm text-slate-400">No patient bookings.</p> :
                  patients.map(pat => (
                    <div key={pat._id} className="p-4 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-slate-900 text-sm">{pat.patientName} ({pat.age}y)</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pat.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{pat.status}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">Doctor: {pat.assignedDoctor?.name || 'Unassigned'}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <select value={pat.status} onChange={e => updatePatStatus(pat._id, e.target.value)} className="text-xs border border-slate-300 rounded px-2 py-1 bg-white">
                          <option value="Waiting">Waiting</option>
                          <option value="In Consultation">In Consultation</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                        <button onClick={() => deletePatient(pat._id)} className="text-xs text-rose-600 hover:underline px-1">Delete</button>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Auth Modal */}
      {isAuthOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative">
            <button onClick={() => setIsAuthOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 text-xl">&times;</button>
            <h3 className="text-lg font-bold text-[#111B43] mb-4">{isRegisterMode ? 'Register Staff' : 'Staff Login'}</h3>
            <form onSubmit={handleAuthSubmit} className="space-y-3">
              {isRegisterMode && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Full Name</label>
                  <input type="text" placeholder="Asadullah" value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} required className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                <input type="email" placeholder="admin@careguide.com" value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} required className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Password</label>
                <input type="password" placeholder="••••••••" value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} required className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <button type="submit" className="w-full bg-[#111B43] hover:bg-slate-800 text-white font-semibold py-2.5 rounded-lg text-sm transition">
                {isRegisterMode ? 'Create Account' : 'Login'}
              </button>
            </form>
            <p className="text-center text-xs text-slate-500 mt-4">
              {isRegisterMode ? 'Already registered?' : "Don't have an account?"}
              <button onClick={() => setIsRegisterMode(!isRegisterMode)} className="text-[#8B5CF6] font-semibold hover:underline ml-1">
                {isRegisterMode ? 'Login' : 'Register Staff'}
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
