'use client';

import React, { useState, useRef } from 'react';
import { useEmergency } from '@/context/EmergencyContext';
import { useAudioSiren } from '@/context/AudioSirenContext';
import {
  Search,
  UserPlus,
  Heart,
  MapPin,
  MessageSquare,
  Filter,
  Eye,
  Camera,
  Upload,
  CheckCircle2,
  AlertCircle,
  Map as MapIcon,
  LayoutGrid,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { MissingPerson } from '@/types';
import { DynamicMissingMap } from './DynamicMissingMap';

export const MissingPersonsView: React.FC = () => {
  const { missingPersons, fetchInitialData } = useEmergency();
  const { playBeep, speakAlert } = useAudioSiren();

  const [viewMode, setViewMode] = useState<'grid' | 'map' | 'split'>('split');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ageGroupFilter, setAgeGroupFilter] = useState('all');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<MissingPerson | null>(null);

  // Sighting Tip Form State
  const [tipComment, setTipComment] = useState('');
  const [tipReporter, setTipReporter] = useState('');
  const [tipAddress, setTipAddress] = useState('');
  const [isSubmittingTip, setIsSubmittingTip] = useState(false);

  // New Missing Person Form State
  const [newName, setNewName] = useState('');
  const [newAge, setNewAge] = useState('');
  const [newGender, setNewGender] = useState('Male');
  const [newClothing, setNewClothing] = useState('');
  const [newMedical, setNewMedical] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newLat, setNewLat] = useState('28.6185');
  const [newLng, setNewLng] = useState('77.2115');
  const [newContact, setNewContact] = useState('');
  const [newReporterName, setNewReporterName] = useState('');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [isSubmittingPerson, setIsSubmittingPerson] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const serverUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5001';

  // Handle Photo File Selection
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Filter Logic
  const filteredList = missingPersons.filter((person) => {
    const matchesStatus = statusFilter === 'all' || person.status === statusFilter;
    const matchesSearch =
      person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.clothingDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.lastSeenLocation.addressName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.medicalConditions.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesAge = true;
    if (ageGroupFilter === 'children') matchesAge = person.age <= 12;
    else if (ageGroupFilter === 'teens') matchesAge = person.age > 12 && person.age <= 19;
    else if (ageGroupFilter === 'adults') matchesAge = person.age >= 20 && person.age < 60;
    else if (ageGroupFilter === 'elderly') matchesAge = person.age >= 60;

    return matchesStatus && matchesSearch && matchesAge;
  });

  // Submit New Missing Person Report
  const handleCreatePerson = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingPerson(true);
    try {
      const finalPhoto =
        photoBase64 ||
        newPhotoUrl ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=60';

      await fetch(`${serverUrl}/api/missing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          age: parseInt(newAge) || 25,
          gender: newGender,
          clothingDescription: newClothing || 'Dark jacket, blue jeans',
          medicalConditions: newMedical || 'None reported',
          lastSeenLocation: {
            lat: parseFloat(newLat) || 28.6185,
            lng: parseFloat(newLng) || 77.2115,
            addressName: newLocation || 'Downtown Sector 4'
          },
          reporterName: newReporterName || 'Family Member',
          reporterContact: newContact || '+1 (555) 000-0000',
          photoUrl: finalPhoto,
          status: 'missing'
        })
      });

      playBeep(1100, 'sine');
      speakAlert(`Missing person report registered for ${newName}. Registry broadcasted.`);

      setShowCreateModal(false);
      setNewName('');
      setNewAge('');
      setNewClothing('');
      setNewMedical('');
      setNewLocation('');
      setPhotoBase64(null);
      await fetchInitialData();
    } catch (err) {
      console.error('Create missing person error:', err);
    } finally {
      setIsSubmittingPerson(false);
    }
  };

  // Submit Sighting Tip
  const handleAddTip = async (personId: string) => {
    if (!tipComment.trim()) return;
    setIsSubmittingTip(true);
    try {
      await fetch(`${serverUrl}/api/missing/${personId}/tips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporterName: tipReporter.trim() || 'Volunteer Scout',
          comment: tipComment.trim(),
          location: {
            lat: 28.6150 + (Math.random() - 0.5) * 0.02,
            lng: 77.2100 + (Math.random() - 0.5) * 0.02,
            addressName: tipAddress.trim() || 'Sector Relief Point'
          },
          suggestedStatus: 'spotted'
        })
      });

      playBeep(980, 'sine');
      setTipComment('');
      setTipAddress('');
      await fetchInitialData();

      const updated = missingPersons.find((p) => p._id === personId);
      if (updated) setSelectedPerson(updated);
    } catch (err) {
      console.error('Add tip error:', err);
    } finally {
      setIsSubmittingTip(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6 font-mono">
      {/* Header & Main Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-tactical-800 pb-3">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Heart className="w-6 h-6 text-rose-500 animate-pulse" />
            MISSING PERSONS REGISTRY & AI RECONNECTION PLATFORM
          </h2>
          <p className="text-xs text-slate-400">
            GEOLOCATED LAST-KNOWN MAPPING, COMMUNITY SIGHTING TIPS & MULTI-ATTRIBUTE SEARCH
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-tactical-900 border border-tactical-700 text-xs">
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
                viewMode === 'split' ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-500' : 'text-slate-400'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Split View</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
                viewMode === 'map' ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-500' : 'text-slate-400'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Map Only</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
                viewMode === 'grid' ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-500' : 'text-slate-400'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards Only</span>
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(244,63,94,0.5)] border border-rose-400 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>REPORT MISSING PERSON</span>
          </button>
        </div>
      </div>

      {/* Search & Multi-Filter Toolbar */}
      <div className="glass-panel p-4 rounded-2xl border border-tactical-700/80 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, clothing, landmark, or medical condition..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-tactical-900 border border-tactical-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Status Filter */}
          <div className="md:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-tactical-900 border border-tactical-700 text-slate-200 text-xs focus:outline-none focus:border-cyan-400 font-bold"
            >
              <option value="all">ALL STATUSES ({missingPersons.length})</option>
              <option value="missing">🔴 MISSING ONLY</option>
              <option value="spotted">🟡 SPOTTED WITH TIPS</option>
              <option value="sheltered">🔵 SHELTERED</option>
              <option value="reunited">🟢 REUNITED</option>
            </select>
          </div>

          {/* Age Group Filter */}
          <div className="md:col-span-3">
            <select
              value={ageGroupFilter}
              onChange={(e) => setAgeGroupFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-tactical-900 border border-tactical-700 text-slate-200 text-xs focus:outline-none focus:border-cyan-400 font-bold"
            >
              <option value="all">ALL AGE GROUPS</option>
              <option value="children">Children (0 - 12 yrs)</option>
              <option value="teens">Teens (13 - 19 yrs)</option>
              <option value="adults">Adults (20 - 59 yrs)</option>
              <option value="elderly">Elderly (60+ yrs)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main View Layout (Map / Split / Grid) */}
      <div className="space-y-6">
        {(viewMode === 'map' || viewMode === 'split') && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-cyan-400" />
                GEOSPATIAL REGISTRY MAP ({filteredList.length} LOCATIONS PINNED)
              </span>
              <span className="text-[10px]">Click any avatar pin to inspect profile</span>
            </div>
            <DynamicMissingMap persons={filteredList} onSelectPerson={(p) => setSelectedPerson(p)} />
          </div>
        )}

        {(viewMode === 'grid' || viewMode === 'split') && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredList.map((person) => {
              return (
                <div
                  key={person._id}
                  onClick={() => setSelectedPerson(person)}
                  className="tactical-card p-4 rounded-2xl border border-tactical-700/80 hover:border-cyan-400 cursor-pointer transition-all flex flex-col justify-between group shadow-xl"
                >
                  <div className="space-y-3">
                    <div className="relative h-48 rounded-xl overflow-hidden bg-tactical-900 border border-tactical-700">
                      <img
                        src={person.photoUrl}
                        alt={person.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 right-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            person.status === 'missing'
                              ? 'bg-red-950 text-red-300 border border-red-600 animate-pulse'
                              : person.status === 'spotted'
                              ? 'bg-yellow-950 text-yellow-300 border border-yellow-500'
                              : person.status === 'sheltered'
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-500'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-500'
                          }`}
                        >
                          {person.status}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {person.name}, {person.age} ({person.gender})
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                        <span className="truncate">{person.lastSeenLocation.addressName}</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-tactical-900/70 border border-tactical-700 text-xs text-slate-300 space-y-1">
                      <div>
                        <strong className="text-slate-400">Clothing:</strong> {person.clothingDescription}
                      </div>
                      {person.medicalConditions && (
                        <div>
                          <strong className="text-rose-400">Medical:</strong> {person.medicalConditions}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-tactical-700/60 flex items-center justify-between text-xs">
                    <span className="text-slate-400">{person.tips?.length || 0} sighting tips</span>
                    <button className="px-3 py-1 rounded bg-rose-600/30 hover:bg-rose-600 text-rose-200 hover:text-white border border-rose-500/40 text-[11px] font-bold transition-all">
                      View & Submit Tip →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Person Detail & Sighting Tip Modal */}
      {selectedPerson && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="tactical-card max-w-2xl w-full p-6 rounded-2xl border border-cyan-500/50 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between border-b border-tactical-700 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-lg">{selectedPerson.name}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                    selectedPerson.status === 'missing'
                      ? 'bg-red-950 text-red-300 border border-red-600'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-500'
                  }`}
                >
                  {selectedPerson.status}
                </span>
              </div>
              <button
                onClick={() => setSelectedPerson(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 bg-tactical-800 rounded-lg"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="h-48 rounded-xl overflow-hidden bg-black border border-tactical-700">
                <img src={selectedPerson.photoUrl} alt={selectedPerson.name} className="w-full h-full object-cover" />
              </div>
              <div className="sm:col-span-2 space-y-2 text-xs text-slate-300">
                <div><strong>Age & Gender:</strong> {selectedPerson.age} years • {selectedPerson.gender}</div>
                <div><strong>Last Known Location:</strong> {selectedPerson.lastSeenLocation.addressName}</div>
                <div><strong>Clothing:</strong> {selectedPerson.clothingDescription}</div>
                <div><strong>Medical Conditions:</strong> <span className="text-rose-400 font-bold">{selectedPerson.medicalConditions}</span></div>
                <div><strong>Reporter Contact:</strong> {selectedPerson.reporterContact} ({selectedPerson.reporterName})</div>
              </div>
            </div>

            {/* Sighting Tips Feed */}
            <div className="space-y-2 pt-2 border-t border-tactical-700">
              <h4 className="font-bold text-slate-200 text-xs uppercase flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                Community Sighting Tips ({selectedPerson.tips?.length || 0})
              </h4>

              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {selectedPerson.tips?.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No community tips submitted yet.</p>
                ) : (
                  selectedPerson.tips.map((tip, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-tactical-900/90 border border-tactical-800 text-xs text-slate-300 space-y-0.5">
                      <div className="flex items-center justify-between text-[10px] text-cyan-300">
                        <span className="font-bold">{tip.reporterName}</span>
                        <span className="text-slate-500">{new Date(tip.timestamp).toLocaleDateString()}</span>
                      </div>
                      <p className="text-slate-200">{tip.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Submit Sighting Tip Form */}
            <div className="p-3 rounded-xl bg-tactical-900/80 border border-tactical-700 space-y-2 text-xs">
              <span className="font-bold text-white block">Submit New Sighting Tip</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Your Name or Callsign"
                  value={tipReporter}
                  onChange={(e) => setTipReporter(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-tactical-950 border border-tactical-700 text-white text-xs"
                />
                <input
                  type="text"
                  placeholder="Sighting Location Landmark"
                  value={tipAddress}
                  onChange={(e) => setTipAddress(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-tactical-950 border border-tactical-700 text-white text-xs"
                />
              </div>
              <textarea
                rows={2}
                placeholder="Describe where and when you saw this person, their condition, clothing..."
                value={tipComment}
                onChange={(e) => setTipComment(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-tactical-950 border border-tactical-700 text-white text-xs"
              />
              <button
                onClick={() => handleAddTip(selectedPerson._id)}
                disabled={isSubmittingTip || !tipComment.trim()}
                className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-xs uppercase"
              >
                {isSubmittingTip ? 'Submitting Tip...' : 'Submit Sighting Tip'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Missing Person Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleCreatePerson}
            className="tactical-card max-w-xl w-full p-6 rounded-2xl border border-rose-500/50 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto font-mono text-xs"
          >
            <div className="flex items-center justify-between border-b border-tactical-700 pb-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <UserPlus className="w-5 h-5" />
                <span>REPORT MISSING PERSON</span>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 bg-tactical-800 rounded-lg"
              >
                ✕ Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-slate-400 block mb-1">Full Name:</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Maya Chen"
                  className="w-full px-3 py-2 rounded-lg bg-tactical-900 border border-tactical-700 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Age:</label>
                <input
                  type="number"
                  required
                  value={newAge}
                  onChange={(e) => setNewAge(e.target.value)}
                  placeholder="e.g. 14"
                  className="w-full px-3 py-2 rounded-lg bg-tactical-900 border border-tactical-700 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Gender:</label>
                <select
                  value={newGender}
                  onChange={(e) => setNewGender(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-tactical-900 border border-tactical-700 text-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-Binary">Non-Binary</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Reporter Contact Phone:</label>
                <input
                  type="text"
                  required
                  value={newContact}
                  onChange={(e) => setNewContact(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3 py-2 rounded-lg bg-tactical-900 border border-tactical-700 text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Last Seen Landmark / Location:</label>
              <input
                type="text"
                required
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="e.g. East Metro Station Plaza Gate 3"
                className="w-full px-3 py-2 rounded-lg bg-tactical-900 border border-tactical-700 text-white"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Clothing & Appearance:</label>
              <input
                type="text"
                required
                value={newClothing}
                onChange={(e) => setNewClothing(e.target.value)}
                placeholder="e.g. Yellow raincoat, denim jeans, black backpack"
                className="w-full px-3 py-2 rounded-lg bg-tactical-900 border border-tactical-700 text-white"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Medical Conditions / Critical Care Needs:</label>
              <input
                type="text"
                value={newMedical}
                onChange={(e) => setNewMedical(e.target.value)}
                placeholder="e.g. Type 1 Diabetes (requires insulin), Asthma"
                className="w-full px-3 py-2 rounded-lg bg-tactical-900 border border-tactical-700 text-white"
              />
            </div>

            {/* Photo Upload or URL */}
            <div>
              <label className="text-slate-400 block mb-1">Photo Upload or Image URL:</label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 rounded-lg bg-tactical-800 hover:bg-tactical-700 text-cyan-300 border border-cyan-500/40 text-xs flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose File...</span>
                </button>
                <input
                  type="url"
                  placeholder="Or paste image URL..."
                  value={newPhotoUrl}
                  onChange={(e) => setNewPhotoUrl(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-tactical-900 border border-tactical-700 text-white text-xs"
                />
              </div>
              {photoBase64 && (
                <div className="mt-2 w-16 h-16 rounded-lg overflow-hidden border border-cyan-400">
                  <img src={photoBase64} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmittingPerson}
              className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(244,63,94,0.6)]"
            >
              {isSubmittingPerson ? 'REGISTERING REPORT...' : 'REGISTER MISSING PERSON REPORT'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
