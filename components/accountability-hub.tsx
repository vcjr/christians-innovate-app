"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Target,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  MessageSquare,
  Users,
  Zap,
  CalendarDays,
  ArrowRight,
  X,
  UserMinus,
  UserPlus,
  Crown,
  Download,
} from 'lucide-react';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';
import { createCommitment, updateCommitmentStatus, leaveGroup, updateRhythmConfig, saveReflection, updateCommitment, updateGroup, removeMember, transferOwnership } from '@/app/accountability/actions';
import { showToast, ToastContainer } from '@/components/toast';
import { generateGoogleCalendarUrl, generateICSFile, downloadICSFile } from '@/utils/calendar-helpers';

// --- TypeScript Interfaces ---
interface GroupMember {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
}

interface Commitment {
  id: string;
  user_id: string;
  commitment_text: string;
  status: 'active' | 'completed' | 'sacrificed';
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  user: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface Group {
  id: string;
  name: string;
  target_objective: string | null;
  created_by: string;
  rhythm_config?: {
    frequency: string;
    day: string;
    time: string;
  } | null;
}

interface Reflection {
  id: string;
  facilitator_id: string;
  reflection_notes: string | null;
  hard_question_response: string | null;
  session_date: string;
  created_at: string;
  user: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface AccountabilityHubProps {
  group: Group;
  members: GroupMember[];
  commitments: Commitment[];
  reflections: Reflection[];
  currentUserId: string;
}

// --- Reusable Sub-Components ---

interface CardProps {
  children: React.ReactNode;
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
}

function Card({ children, title, icon: Icon, action }: CardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5 text-blue-600" />}
          <h3 className="font-semibold text-gray-900">{title}</h3>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

const TargetView = ({ objective, onEditTarget, isCreator }: { objective: string; onEditTarget: () => void; isCreator: boolean }) => (
  <div className="bg-blue-600 text-white p-6 rounded-2xl shadow-lg mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div className="flex items-center gap-4">
      <div className="bg-white/20 p-3 rounded-full">
        <Target className="w-8 h-8" />
      </div>
      <div>
        <p className="text-blue-100 text-sm font-medium uppercase tracking-wider">Primary Objective</p>
        <h1 className="text-2xl md:text-3xl font-bold">{objective}</h1>
      </div>
    </div>
    {isCreator && (
      <div className="flex gap-2">
        <button
          onClick={onEditTarget}
          className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition text-sm font-medium backdrop-blur-sm"
        >
          Edit Target
        </button>
      </div>
    )}
  </div>
);

// --- Hard Questions Pool ---
const HARD_QUESTIONS = [
  "Where did you let fear or comfort dictate your actions this week instead of your calling?",
  "What commitment did you avoid this week, and what was the real reason?",
  "If your group could see every hour of your week, what would you be embarrassed about?",
  "What is the one thing you know you should be doing but keep putting off?",
  "Where are you settling for good enough instead of pursuing excellence?",
  "What lie are you telling yourself to justify staying in your comfort zone?",
  "Who did you fail to serve this week because you were focused on yourself?",
  "What would change if you truly believed God was backing your mission?",
  "Where did you choose the easy path instead of the right path this week?",
  "What conversation are you avoiding that could unlock your next breakthrough?",
  "If you kept this exact pace for a year, would you be proud of where you end up?",
  "What habit is quietly sabotaging your progress that you haven't addressed?",
  "Where are you waiting for permission instead of taking initiative?",
  "What would your future self wish you had started this week?",
  "Are you spending your best energy on your highest priority, or just the loudest demand?",
  "What risk are you not taking because you're afraid of what people will think?",
  "Where have you been coasting on past momentum instead of building new momentum?",
  "What boundary do you need to set to protect your mission?",
  "Who in your life needs you to lead right now, and how are you showing up for them?",
  "What is the cost of inaction on the thing you've been delaying?",
  "Where did you let perfectionism become an excuse for not shipping?",
  "What does your calendar say about your real priorities versus your stated ones?",
  "If you had to teach someone what you learned from your failures this week, what would you say?",
  "What would radical obedience look like for you right now?",
  "Where are you playing it safe when God is calling you to be bold?",
  "What unresolved conflict is draining energy that should go toward your mission?",
  "Are you building something that matters, or just staying busy?",
  "What would you attempt if you knew you could not fail?",
  "Where did comparison steal your joy or momentum this week?",
  "What truth do you need to hear that nobody around you is willing to say?",
];

// --- Main Hub Component ---

export default function AccountabilityHub({ group, members, commitments: initialCommitments, reflections, currentUserId }: AccountabilityHubProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, rhythm, debrief
  const [commitments, setCommitments] = useState(initialCommitments);

  // Sync state when server data refreshes
  useEffect(() => {
    setCommitments(initialCommitments);
  }, [initialCommitments]);

  const [newCommitment, setNewCommitment] = useState('');
  const [newCommitmentDueDate, setNewCommitmentDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit commitment state
  const [editingCommitment, setEditingCommitment] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editDueDate, setEditDueDate] = useState('');

  // Rhythm configuration state
  const [rhythmFrequency, setRhythmFrequency] = useState(group.rhythm_config?.frequency || 'weekly');
  const [rhythmDay, setRhythmDay] = useState(group.rhythm_config?.day || 'Monday');
  const [rhythmTime, setRhythmTime] = useState(group.rhythm_config?.time || '09:00');

  // Debrief reflection state
  const [reflectionNotes, setReflectionNotes] = useState('');
  const [isSavingReflection, setIsSavingReflection] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(() =>
    HARD_QUESTIONS[Math.floor(Math.random() * HARD_QUESTIONS.length)]
  );

  // Member management state
  const [showMemberModal, setShowMemberModal] = useState(false);

  // Edit target modal state
  const [showEditTargetModal, setShowEditTargetModal] = useState(false);
  const [editGroupName, setEditGroupName] = useState(group.name);
  const [editTargetObjective, setEditTargetObjective] = useState(group.target_objective || '');
  const [isSavingTarget, setIsSavingTarget] = useState(false);

  // Set up real-time subscription for commitments
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel('group-commitments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_commitments',
          filter: `group_id=eq.${group.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // Fetch the full commitment with user data
            supabase
              .from('group_commitments')
              .select('*')
              .eq('id', payload.new.id)
              .single()
              .then(async ({ data: commitment }) => {
                if (commitment) {
                  // Fetch user profile separately
                  const { data: userProfile } = await supabase
                    .from('user_profiles')
                    .select('full_name, avatar_url')
                    .eq('user_id', commitment.user_id)
                    .single()

                  const fullCommitment = {
                    ...commitment,
                    user: userProfile || { full_name: null, avatar_url: null }
                  }
                  setCommitments((prev) => [fullCommitment, ...prev]);
                }
              });
          } else if (payload.eventType === 'UPDATE') {
            setCommitments((prev) =>
              prev.map((c) =>
                c.id === payload.new.id
                  ? { ...c, ...payload.new }
                  : c
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setCommitments((prev) => prev.filter((c) => c.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [group.id]);

  const addCommitment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommitment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('commitment_text', newCommitment);
    if (newCommitmentDueDate) {
      formData.append('due_date', newCommitmentDueDate);
    }

    const result = await createCommitment(formData);

    if (!result?.error) {
      setNewCommitment('');
      setNewCommitmentDueDate('');
      router.refresh();
    }
    setIsSubmitting(false);
  };

  const startEditingCommitment = (commitment: Commitment) => {
    setEditingCommitment(commitment.id);
    setEditText(commitment.commitment_text);
    setEditDueDate(commitment.due_date || '');
  };

  const cancelEditingCommitment = () => {
    setEditingCommitment(null);
    setEditText('');
    setEditDueDate('');
  };

  const saveEditCommitment = async (commitmentId: string) => {
    if (!editText.trim()) return;

    const formData = new FormData();
    formData.append('commitment_id', commitmentId);
    formData.append('commitment_text', editText);
    if (editDueDate) {
      formData.append('due_date', editDueDate);
    }

    try {
      await updateCommitment(formData);
      showToast('Commitment updated successfully', 'success');
      setEditingCommitment(null);
      setEditText('');
      setEditDueDate('');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to update commitment', 'error');
    }
  };

  const toggleCommitmentStatus = async (commitmentId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'active' : 'completed';
    const formData = new FormData();
    formData.append('commitment_id', commitmentId);
    formData.append('status', newStatus);

    await updateCommitmentStatus(formData);
    router.refresh();
  };

  const saveRhythm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('frequency', rhythmFrequency);
    formData.append('day', rhythmDay);
    formData.append('time', rhythmTime);

    try {
      await updateRhythmConfig(formData);
      showToast('Rhythm configuration saved successfully!', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to save rhythm configuration', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddToGoogleCalendar = () => {
    const attendeeEmails = members
      .filter(m => m.email)
      .map(m => m.email as string);
    const url = generateGoogleCalendarUrl(group.name, {
      frequency: rhythmFrequency as 'weekly' | 'biweekly',
      day: rhythmDay,
      time: rhythmTime
    }, attendeeEmails);
    window.open(url, '_blank');
  };

  const handleDownloadICS = () => {
    const attendees = members
      .filter(m => m.email)
      .map(m => ({ name: m.full_name || 'Member', email: m.email as string }));
    const icsContent = generateICSFile(group.name, {
      frequency: rhythmFrequency as 'weekly' | 'biweekly',
      day: rhythmDay,
      time: rhythmTime
    }, attendees);
    downloadICSFile(icsContent, `${group.name.replace(/\s+/g, '-')}-accountability-meeting`);
    showToast('Calendar file downloaded!', 'success');
  };

  const saveDebriefReflection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reflectionNotes.trim()) return;

    setIsSavingReflection(true);
    const formData = new FormData();
    formData.append('reflection_notes', reflectionNotes);
    formData.append('hard_question_response', currentQuestion);

    try {
      await saveReflection(formData);
      showToast('Reflection saved successfully!', 'success');
      setReflectionNotes('');
      setCurrentQuestion(HARD_QUESTIONS[Math.floor(Math.random() * HARD_QUESTIONS.length)]);
      router.refresh();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to save reflection', 'error');
    } finally {
      setIsSavingReflection(false);
    }
  };

  const handleRemoveMember = async (memberUserId: string) => {
    if (!confirm('Are you sure you want to remove this member from the group?')) return;

    const formData = new FormData();
    formData.append('member_user_id', memberUserId);

    try {
      await removeMember(formData);
      showToast('Member removed successfully', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to remove member', 'error');
    }
  };

  const handleTransferOwnership = async (newOwnerId: string) => {
    if (!confirm('Are you sure you want to transfer group ownership? You will no longer be able to manage the group.')) return;

    const formData = new FormData();
    formData.append('new_owner_id', newOwnerId);

    try {
      await transferOwnership(formData);
      showToast('Ownership transferred successfully', 'success');
      setShowMemberModal(false);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to transfer ownership', 'error');
    }
  };

  const activeCommitments = useMemo(
    () => commitments.filter(c => c.status === 'active'),
    [commitments]
  );

  const completionRate = useMemo(() => {
    if (commitments.length === 0) return 0;
    const completed = commitments.filter(c => c.status === 'completed').length;
    return Math.round((completed / commitments.length) * 100);
  }, [commitments]);

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer />
      <div className="max-w-7xl mx-auto">

        {/* 1. THE VISUAL DASHBOARD (TARGET VIEW) */}
        <TargetView
          objective={group.target_objective || group.name}
          onEditTarget={() => setShowEditTargetModal(true)}
          isCreator={group.created_by === currentUserId}
        />

        {/* Group Settings */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex gap-1 bg-gray-200 p-1 rounded-xl w-fit">
            {['dashboard', 'rhythm', 'debrief'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab
                  ? 'bg-white shadow-sm text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex gap-3 items-center">
            <button
              onClick={() => setShowMemberModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
            >
              <Users className="w-4 h-4" />
              Manage Members ({members.length})
            </button>

            <form action={async () => void await leaveGroup()}>
              <button
                type="submit"
                className="text-sm text-red-600 hover:text-red-700 font-medium"
                onClick={(e) => {
                  if (!confirm('Are you sure you want to leave this group?')) {
                    e.preventDefault();
                  }
                }}
              >
                Leave Group
              </button>
            </form>
          </div>
        </div>

        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* 2. COMMITMENT MAP (THE SPACE) */}
            <div className="lg:col-span-2 space-y-6">
              <Card
                title="Collective Commitment Map"
                icon={Zap}
                action={
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold">
                    {activeCommitments.length} Active
                  </span>
                }
              >
                {/* Fast Entry (Under 10s test) */}
                <form onSubmit={addCommitment} className="space-y-3 mb-6">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="What is your commitment for this week?"
                      className="flex-1 bg-gray-100 border-none rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={newCommitment}
                      onChange={(e) => setNewCommitment(e.target.value)}
                      disabled={isSubmitting}
                    />
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition disabled:opacity-50"
                      disabled={isSubmitting}
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-600 font-medium">Due Date (optional):</label>
                    <input
                      type="date"
                      value={newCommitmentDueDate}
                      onChange={(e) => setNewCommitmentDueDate(e.target.value)}
                      className="text-xs bg-gray-100 border-none rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 outline-none"
                      disabled={isSubmitting}
                    />
                  </div>
                </form>

                <div className="space-y-3">
                  {commitments.length === 0 ? (
                    <p className="text-center text-gray-400 py-8">No commitments yet. Add your first one above!</p>
                  ) : (
                    commitments.map((c) => {
                      const userName = c.user_id === currentUserId ? 'Me' : (c.user?.full_name || 'Unknown');
                      const isEditing = editingCommitment === c.id;

                      return (
                        <div key={c.id} className="p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
                          {isEditing ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="w-full bg-gray-100 border-none rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                              />
                              <div className="flex items-center gap-2">
                                <label className="text-xs text-gray-600">Due Date:</label>
                                <input
                                  type="date"
                                  value={editDueDate}
                                  onChange={(e) => setEditDueDate(e.target.value)}
                                  className="text-xs bg-gray-100 border-none rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => saveEditCommitment(c.id)}
                                  className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={cancelEditingCommitment}
                                  className="text-xs px-3 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1">
                                {c.user_id === currentUserId ? (
                                  <button
                                    onClick={() => toggleCommitmentStatus(c.id, c.status)}
                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${c.status === 'completed' ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-blue-500'
                                      }`}
                                  >
                                    {c.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-white" />}
                                  </button>
                                ) : (
                                  <div
                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${c.status === 'completed' ? 'bg-green-500 border-green-500' : 'border-gray-300'
                                      }`}
                                  >
                                    {c.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-white" />}
                                  </div>
                                )}
                                <div className="flex-1">
                                  <p className={`text-sm font-medium ${c.status === 'completed' ? 'line-through text-gray-400' : ''}`}>
                                    {c.commitment_text}
                                  </p>
                                  <div className="flex gap-2 items-center mt-1">
                                    <span className="text-[10px] uppercase font-bold text-blue-500">{userName}</span>
                                    {c.due_date && (
                                      <>
                                        <span className="text-[10px] text-gray-400">•</span>
                                        <span className="text-[10px] text-gray-500">
                                          Due: {new Date(c.due_date).toLocaleDateString()}
                                        </span>
                                      </>
                                    )}
                                    <span className="text-[10px] text-gray-400">• {new Date(c.created_at).toLocaleDateString()}</span>
                                  </div>
                                </div>
                              </div>
                              {c.user_id === currentUserId && (
                                <button
                                  onClick={() => startEditingCommitment(c)}
                                  className="text-xs text-blue-600 hover:text-blue-700 font-medium ml-2"
                                >
                                  Edit
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>
            </div>

            {/* Sidebar Stats / Logistics Quick-View */}
            <div className="space-y-6">
              <Card title="Meeting Rhythm" icon={CalendarDays}>
                {group.rhythm_config ? (
                  <div className="text-center py-4">
                    <div className="bg-gray-100 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Clock className="w-6 h-6 text-blue-600" />
                    </div>
                    <h4 className="font-bold text-lg capitalize">{group.rhythm_config.frequency}</h4>
                    <p className="text-sm text-gray-500">
                      {group.rhythm_config.day}s @ {(() => {
                        const [h, m] = group.rhythm_config!.time.split(':');
                        const hour = parseInt(h);
                        const ampm = hour >= 12 ? 'PM' : 'AM';
                        const displayHour = hour % 12 || 12;
                        return `${displayHour}:${m || '00'} ${ampm}`;
                      })()}
                    </p>
                    <button
                      onClick={() => setActiveTab('rhythm')}
                      className="mt-4 inline-block w-full border border-blue-200 text-blue-600 py-2 rounded-lg hover:bg-blue-50 transition font-medium text-sm"
                    >
                      Edit Rhythm
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-400">No rhythm configured</p>
                    <p className="text-xs text-gray-400 mt-2">Set one up in the Rhythm tab</p>
                  </div>
                )}
              </Card>

              <Card title="Group Progress" icon={Users}>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Collective Momentum</span>
                      <span>{completionRate}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full transition-all" style={{ width: `${completionRate}%` }} />
                    </div>
                  </div>
                  <div className="flex -space-x-2">
                    {members.slice(0, 5).map((member) => (
                      member.avatar_url ? (
                        <Image
                          key={member.user_id}
                          src={member.avatar_url}
                          alt={member.full_name || 'Member'}
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-full border-2 border-white"
                        />
                      ) : (
                        <div key={member.user_id} className="w-8 h-8 rounded-full border-2 border-white bg-gray-300 flex items-center justify-center text-[10px] font-bold">
                          {member.full_name?.charAt(0) || '?'}
                        </div>
                      )
                    ))}
                    {members.length > 5 && (
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold">
                        +{members.length - 5}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )
        }

        {
          activeTab === 'rhythm' && (
            <div className="max-w-2xl mx-auto py-10">
              <h2 className="text-2xl font-bold mb-6">Meeting Rhythm</h2>
              <Card title="Automated Scheduling" icon={Calendar}>
                <p className="text-gray-500 text-sm mb-6">Establish a non-negotiable cadence for your innovation team.</p>

                <form onSubmit={saveRhythm} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div
                      onClick={() => setRhythmFrequency('weekly')}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition ${rhythmFrequency === 'weekly'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                        }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className={`font-bold ${rhythmFrequency === 'weekly' ? 'text-blue-600' : ''}`}>Weekly</h4>
                        {rhythmFrequency === 'weekly' && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                      </div>
                      <p className="text-xs text-gray-500">Best for high-execution phases.</p>
                    </div>
                    <div
                      onClick={() => setRhythmFrequency('biweekly')}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition ${rhythmFrequency === 'biweekly'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                        }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className={`font-bold ${rhythmFrequency === 'biweekly' ? 'text-blue-600' : ''}`}>Bi-Weekly</h4>
                        {rhythmFrequency === 'biweekly' && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                      </div>
                      <p className="text-xs text-gray-500">Best for steady-state projects.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-bold block">Select Day & Time</label>
                    <div className="flex gap-2">
                      <select
                        value={rhythmDay}
                        onChange={(e) => setRhythmDay(e.target.value)}
                        className="flex-1 bg-gray-100 p-2 rounded-lg text-sm border-none"
                      >
                        <option>Monday</option>
                        <option>Tuesday</option>
                        <option>Wednesday</option>
                        <option>Thursday</option>
                        <option>Friday</option>
                        <option>Saturday</option>
                        <option>Sunday</option>
                      </select>
                      <input
                        type="time"
                        value={rhythmTime}
                        onChange={(e) => setRhythmTime(e.target.value)}
                        className="flex-1 bg-gray-100 p-2 rounded-lg text-sm border-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || group.created_by !== currentUserId}
                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Saving...' : 'Establish Rhythm in 1 Click'}
                  </button>
                  {group.created_by !== currentUserId && (
                    <p className="text-xs text-gray-500 text-center">Only the group creator can change the rhythm</p>
                  )}
                </form>

                {/* Calendar Integration */}
                {group.rhythm_config && (
                  <div className="mt-4 space-y-3">
                    <p className="text-xs text-gray-500 text-center">Add to your calendar:</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={handleAddToGoogleCalendar}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-sm font-medium text-gray-700"
                      >
                        <Calendar className="w-4 h-4" />
                        Google Calendar
                      </button>
                      <button
                        onClick={handleDownloadICS}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-sm font-medium text-gray-700"
                      >
                        <Download className="w-4 h-4" />
                        Download .ics
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          )
        }

        {
          activeTab === 'debrief' && (
            <>
              <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 py-10">
                <div>
                  <h2 className="text-2xl font-bold mb-6">Guided Execution</h2>
                  <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-blue-600">
                        <MessageSquare className="w-5 h-5" />
                        <span className="text-xs font-bold uppercase tracking-widest">The Hard Question</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentQuestion(HARD_QUESTIONS[Math.floor(Math.random() * HARD_QUESTIONS.length)])}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:bg-blue-50 px-2 py-1 rounded transition"
                      >
                        New Question
                      </button>
                    </div>
                    <h3 className="text-xl font-medium italic text-gray-900">&ldquo;{currentQuestion}&rdquo;</h3>

                    <form onSubmit={saveDebriefReflection} className="pt-4 border-t border-gray-100 space-y-4">
                      <textarea
                        value={reflectionNotes}
                        onChange={(e) => setReflectionNotes(e.target.value)}
                        placeholder="Type your reflection here..."
                        className="w-full bg-gray-50 text-gray-900 placeholder-gray-400 border border-gray-200 rounded-lg p-3 min-h-[120px] focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        disabled={isSavingReflection}
                      />
                      <div className="flex items-center justify-between">
                        <button
                          type="submit"
                          disabled={isSavingReflection || !reflectionNotes.trim()}
                          className="flex items-center gap-2 text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSavingReflection ? 'Saving...' : 'Save Reflection'}
                        </button>
                        <span className="text-[10px] text-gray-400 italic">Notes are private to the group</span>
                      </div>
                    </form>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-blue-600" />
                    Outstanding Commitments
                  </h3>
                  <p className="text-xs text-gray-500 mb-4">Items auto-populated from your last session.</p>

                  {activeCommitments.length === 0 ? (
                    <p className="text-center text-gray-400 py-8">All commitments complete! 🎉</p>
                  ) : (
                    activeCommitments.map(c => (
                      <div key={c.id} className="p-4 bg-white border border-gray-200 rounded-xl flex items-center justify-between shadow-sm">
                        <span className="text-sm font-medium">{c.commitment_text}</span>
                        {c.user_id === currentUserId && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => toggleCommitmentStatus(c.id, c.status)}
                              className="text-xs font-bold text-green-500 hover:bg-green-50 px-2 py-1 rounded transition"
                            >
                              Mark Complete
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Past Reflections */}
              <div className="max-w-4xl mx-auto mt-10">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  Group Reflections
                </h3>
                {reflections.length === 0 ? (
                  <p className="text-center text-gray-400 py-8 bg-white border border-gray-200 rounded-xl">No reflections yet. Be the first to share above!</p>
                ) : (
                  <div className="space-y-4">
                    {reflections.map((r) => (
                      <div key={r.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                          {r.user.avatar_url ? (
                            <Image
                              src={r.user.avatar_url}
                              alt={r.user.full_name || 'Member'}
                              width={32}
                              height={32}
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                              {r.user.full_name?.charAt(0) || '?'}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {r.facilitator_id === currentUserId ? 'You' : (r.user.full_name || 'Unknown')}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              {new Date(r.session_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        {r.hard_question_response && (
                          <p className="text-xs text-blue-600 italic mb-2">&ldquo;{r.hard_question_response}&rdquo;</p>
                        )}
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{r.reflection_notes}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )
        }

      </div >

      {/* Member Management Modal */}
      {
        showMemberModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Users className="w-6 h-6 text-blue-600" />
                  Group Members
                </h2>
                <button
                  onClick={() => setShowMemberModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-3">
                  {members.map((member) => (
                    <div key={member.user_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {member.avatar_url ? (
                          <Image
                            src={member.avatar_url}
                            alt={member.full_name || 'Member'}
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded-full"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                            {member.full_name?.charAt(0) || '?'}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold">{member.full_name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500">
                            {member.user_id === group.created_by && (
                              <span className="inline-flex items-center gap-1 text-yellow-600">
                                <Crown className="w-3 h-3" />
                                Group Creator
                              </span>
                            )}
                            {member.user_id === currentUserId && ' (You)'}
                          </p>
                        </div>
                      </div>

                      {group.created_by === currentUserId && member.user_id !== currentUserId && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleTransferOwnership(member.user_id)}
                            className="text-xs px-3 py-1.5 border border-yellow-500 text-yellow-600 rounded-lg hover:bg-yellow-50 transition flex items-center gap-1"
                          >
                            <Crown className="w-3 h-3" />
                            Make Owner
                          </button>
                          <button
                            onClick={() => handleRemoveMember(member.user_id)}
                            className="text-xs px-3 py-1.5 border border-red-500 text-red-600 rounded-lg hover:bg-red-50 transition flex items-center gap-1"
                          >
                            <UserMinus className="w-3 h-3" />
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 border-t border-gray-200">
                <a
                  href="/directory"
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  <UserPlus className="w-4 h-4" />
                  Invite Members from Directory
                </a>
              </div>
            </div>
          </div>
        )
      }

      {/* Edit Target Modal */}
      {
        showEditTargetModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  Edit Group
                </h2>
                <button
                  onClick={() => setShowEditTargetModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!editGroupName.trim() || !editTargetObjective.trim()) return;

                  setIsSavingTarget(true);
                  const formData = new FormData();
                  formData.append('group_id', group.id);
                  formData.append('name', editGroupName);
                  formData.append('target_objective', editTargetObjective);

                  const result = await updateGroup(formData);

                  if (result?.error) {
                    showToast(result.error, 'error');
                  } else {
                    showToast('Group updated successfully!', 'success');
                    setShowEditTargetModal(false);
                  }
                  setIsSavingTarget(false);
                }}
                className="p-6 space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Group Name
                  </label>
                  <input
                    type="text"
                    value={editGroupName}
                    onChange={(e) => setEditGroupName(e.target.value)}
                    className="w-full bg-gray-100 border-none rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Group name"
                    required
                    disabled={isSavingTarget}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Primary Objective
                  </label>
                  <textarea
                    value={editTargetObjective}
                    onChange={(e) => setEditTargetObjective(e.target.value)}
                    className="w-full bg-gray-100 border-none rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none resize-none min-h-[100px]"
                    placeholder="What is your group working towards?"
                    required
                    disabled={isSavingTarget}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSavingTarget}
                    className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSavingTarget ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditTargetModal(false)}
                    disabled={isSavingTarget}
                    className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }
    </div >
  );
}
