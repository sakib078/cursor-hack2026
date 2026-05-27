"use client";

interface CopingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const resources = [
  {
    title: "It's okay to feel this way",
    description: "Grief isn't linear. Some days are harder than others, and that's completely normal.",
  },
  {
    title: "Ground yourself",
    description: "Try the 5-4-3-2-1 technique: notice 5 things you see, 4 you feel, 3 you hear, 2 you smell, 1 you taste.",
  },
  {
    title: "Let yourself feel",
    description: "You don't need to be strong right now. Crying, laughing, anger — it's all part of the process.",
  },
  {
    title: "Reach out",
    description: "Talk to someone you trust. You don't have to carry this alone.",
  },
  {
    title: "Crisis Support",
    description: "If you're in crisis, please reach out to the 988 Suicide & Crisis Lifeline (call or text 988).",
    isEmergency: true,
  },
];

export default function CopingDrawer({ isOpen, onClose }: CopingDrawerProps) {
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      )}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-sm bg-stone-900 border-l border-stone-800 z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6 h-full overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-stone-100">Coping Resources</h2>
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-stone-200 transition-colors p-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          <p className="text-sm text-stone-400 mb-6">
            Take a moment. Breathe. These are here whenever you need them.
          </p>

          <div className="space-y-4">
            {resources.map((r, i) => (
              <div
                key={i}
                className={`p-4 rounded-xl ${
                  r.isEmergency
                    ? "bg-red-950/50 border border-red-900/50"
                    : "bg-stone-800/50 border border-stone-700/50"
                }`}
              >
                <h3 className={`text-sm font-medium mb-1 ${r.isEmergency ? "text-red-300" : "text-stone-200"}`}>
                  {r.title}
                </h3>
                <p className="text-xs text-stone-400 leading-relaxed">{r.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
