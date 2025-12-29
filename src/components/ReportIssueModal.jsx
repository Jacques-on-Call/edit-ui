import { h } from 'preact';
import { useState } from 'preact/hooks';
import { X, Bug, Lightbulb, Send, CheckCircle2 } from 'lucide-preact';
import { fetchJson } from '../lib/fetchJson';
import { useAuth } from '../contexts/AuthContext';

export default function ReportIssueModal({ isOpen, onClose, context = {} }) {
    const { selectedRepo } = useAuth();
    const [type, setType] = useState('bug');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState(null);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!description.trim()) return;

        setIsSubmitting(true);
        setError(null);

        try {
            await fetchJson('/api/report-issue', {
                method: 'POST',
                body: JSON.stringify({
                    repo: selectedRepo.full_name,
                    type,
                    description,
                    pageName: context.pageId || 'Unknown',
                    componentName: context.activeComponent || 'Editor',
                    context
                })
            });
            setIsSuccess(true);
            setTimeout(() => {
                setIsSuccess(false);
                setDescription('');
                onClose();
            }, 2000);
        } catch (err) {
            console.error('Failed to report issue:', err);
            setError('Failed to send report. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-800/50">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        {type === 'bug' ? <Bug size={24} className="text-red-400" /> : <Lightbulb size={24} className="text-yellow-400" />}
                        {type === 'bug' ? 'Report a Bug' : 'Request a Feature'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {isSuccess ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in slide-in-from-bottom-4">
                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle2 size={40} className="text-green-500" />
                            </div>
                            <h4 className="text-2xl font-bold text-white mb-2">Thank You!</h4>
                            <p className="text-gray-400">Your report has been added to the snag list.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Type Switcher */}
                            <div className="flex p-1 bg-gray-800 rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => setType('bug')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-all ${type === 'bug'
                                            ? 'bg-red-600 text-white shadow-lg'
                                            : 'text-gray-400 hover:text-gray-200'
                                        }`}
                                >
                                    <Bug size={18} />
                                    Bug
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setType('feature')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-all ${type === 'feature'
                                            ? 'bg-blue-600 text-white shadow-lg'
                                            : 'text-gray-400 hover:text-gray-200'
                                        }`}
                                >
                                    <Lightbulb size={18} />
                                    Feature
                                </button>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    What's on your mind?
                                </label>
                                <textarea
                                    autoFocus
                                    value={description}
                                    onInput={(e) => setDescription(e.target.value)}
                                    placeholder={type === 'bug' ? "Describe the issue..." : "What would you like to see?"}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-none"
                                    disabled={isSubmitting}
                                />
                            </div>

                            {/* Page Info (Hidden/Static) */}
                            <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-800">
                                <p className="text-xs text-gray-500 flex items-center gap-2">
                                    <span className="font-mono text-gray-400">Context:</span>
                                    {context.pageId || 'General'} | {context.activeComponent || 'UI'}
                                </p>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-3 px-4 rounded-xl border border-gray-700 text-white font-medium hover:bg-gray-800 transition-colors"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !description.trim()}
                                    className="flex-3 bg-white text-black py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {isSubmitting ? (
                                        <RefreshCw size={20} className="animate-spin" />
                                    ) : (
                                        <Send size={20} />
                                    )}
                                    Submit {type === 'bug' ? 'Bug' : 'Request'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
