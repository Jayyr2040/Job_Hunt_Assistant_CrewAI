import React, { useState } from 'react';
import { CandidateProfile } from '../types';
import { X, Save, Plus, UserCheck, ShieldAlert, Briefcase, GraduationCap, DollarSign } from 'lucide-react';

interface CandidateVaultModalProps {
  candidate: CandidateProfile;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: CandidateProfile) => void;
}

export const CandidateVaultModal: React.FC<CandidateVaultModalProps> = ({
  candidate,
  isOpen,
  onClose,
  onSave
}) => {
  const [profile, setProfile] = useState<CandidateProfile>({ ...candidate });
  const [newSkill, setNewSkill] = useState('');
  const [newTitle, setNewTitle] = useState('');

  if (!isOpen) return null;

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    setProfile((prev) => ({ ...prev, skills: [...prev.skills, newSkill.trim()] }));
    setNewSkill('');
  };

  const handleRemoveSkill = (skill: string) => {
    setProfile((prev) => ({ ...prev, skills: prev.skills.filter((s) => s !== skill) }));
  };

  const handleAddTitle = () => {
    if (!newTitle.trim()) return;
    setProfile((prev) => ({ ...prev, targetTitles: [...prev.targetTitles, newTitle.trim()] }));
    setNewTitle('');
  };

  const handleRemoveTitle = (title: string) => {
    setProfile((prev) => ({ ...prev, targetTitles: prev.targetTitles.filter((t) => t !== title) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(profile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-gray-200 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gray-900 text-white rounded-2xl">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase">Master Vault</span>
              <h2 className="font-semibold text-lg text-gray-900">Candidate Grounding Profile</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Personal Info & Guardrails */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-gray-700 mb-1">Candidate Full Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900 focus:bg-white focus:ring-1 focus:ring-gray-900 outline-none transition-all font-medium"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900 focus:bg-white focus:ring-1 focus:ring-gray-900 outline-none transition-all font-medium"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                Minimum Salary Threshold (Guardrail)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={profile.minSalary}
                  onChange={(e) => setProfile({ ...profile, minSalary: Number(e.target.value) })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900 focus:bg-white focus:ring-1 focus:ring-gray-900 outline-none transition-all font-medium font-mono"
                  required
                />
                <select
                  value={profile.currency}
                  onChange={(e) => setProfile({ ...profile, currency: e.target.value })}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 text-gray-900 font-mono font-medium"
                >
                  <option value="USD">USD</option>
                  <option value="SGD">SGD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                Work Authorization Status
              </label>
              <input
                type="text"
                value={profile.workAuthorization}
                onChange={(e) => setProfile({ ...profile, workAuthorization: e.target.value })}
                placeholder="e.g., US Citizen / Green Card Holder"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900 focus:bg-white focus:ring-1 focus:ring-gray-900 outline-none transition-all font-medium"
                required
              />
            </div>
          </div>

          {/* Target Job Titles */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">Target Job Titles</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {profile.targetTitles.map((title) => (
                <span
                  key={title}
                  className="inline-flex items-center gap-1 bg-gray-100 border border-gray-200 text-gray-800 px-2.5 py-1 rounded-xl font-medium"
                >
                  {title}
                  <button
                    type="button"
                    onClick={() => handleRemoveTitle(title)}
                    className="hover:text-red-600 cursor-pointer ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add target title (e.g. AI Platform Engineer)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900 outline-none"
              />
              <button
                type="button"
                onClick={handleAddTitle}
                className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl flex items-center gap-1 cursor-pointer font-medium"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
          </div>

          {/* Skills List */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">Master Technical Skills</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {profile.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 bg-gray-100 border border-gray-200 text-gray-800 px-2.5 py-1 rounded-xl font-medium"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="hover:text-red-600 cursor-pointer ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add skill (e.g. Docker, GraphQL)"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900 outline-none"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl flex items-center gap-1 cursor-pointer font-medium border border-gray-200"
              >
                <Plus className="w-4 h-4" /> Add Skill
              </button>
            </div>
          </div>

          {/* Experience Summary */}
          <div>
            <label className="block font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5 text-gray-700" />
              Executive Summary & Achievements
            </label>
            <textarea
              rows={3}
              value={profile.experienceSummary}
              onChange={(e) => setProfile({ ...profile, experienceSummary: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900 focus:bg-white focus:ring-1 focus:ring-gray-900 outline-none transition-all leading-relaxed"
            />
          </div>

          {/* Education & Portfolio */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-gray-700 mb-1 flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-gray-700" />
                Education Details
              </label>
              <input
                type="text"
                value={profile.education}
                onChange={(e) => setProfile({ ...profile, education: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900 outline-none"
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-1">Portfolio / Github URL</label>
              <input
                type="url"
                value={profile.portfolioUrl || ''}
                onChange={(e) => setProfile({ ...profile, portfolioUrl: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-900 outline-none font-mono"
              />
            </div>
          </div>

          {/* Submit Footer */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-500 hover:text-gray-900 rounded-xl hover:bg-gray-100 transition-colors font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-xl shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" /> Save Candidate Vault
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

