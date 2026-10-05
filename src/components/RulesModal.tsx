import React from 'react';
import { X, MousePointer2, Layers, CheckCircle2, Trophy } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl border border-zinc-200/90 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
          aria-label="Zamknij"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-lg font-bold tracking-tight text-zinc-900 mb-1">
          Zasady i sterowanie
        </h3>
        <p className="text-xs text-zinc-500 mb-5">
          Klasyczny pasjans Klondike w minimalistycznej odsłonie.
        </p>

        <div className="space-y-4 text-xs text-zinc-600 mb-6">
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-700 shrink-0">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-zinc-900 mb-0.5">Cel gry</p>
              <p>
                Ułóż wszystkie 52 karty na 4 polach bazowych w prawym górnym rogu, od Asa do Króla w tym samym kolorze (Pik, Kier, Karo, Trefl).
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-700 shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-zinc-900 mb-0.5">Układanie kart w kolumnach</p>
              <p>
                Karty w 7 kolumnach układaj malejąco z naprzemiennymi kolorami (czerwona na czarną, czarna na czerwoną). Na puste pole kolumny możesz położyć tylko Króla.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-700 shrink-0">
              <MousePointer2 className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-zinc-900 mb-0.5">Płynne sterowanie w stylu Apple</p>
              <ul className="list-disc list-inside space-y-1 mt-1 text-zinc-500">
                <li><strong className="text-zinc-700">Przeciągnij i upuść:</strong> chwyć dowolną odkrytą kartę lub stos kart i upuść na cel.</li>
                <li><strong className="text-zinc-700">Pojedyncze kliknięcie:</strong> natychmiast przenosi kartę na najlepsze dostępne pole (baza lub kolumna).</li>
                <li><strong className="text-zinc-700">Podwójne kliknięcie:</strong> szybko odsyła kartę bezpośrednio do bazy.</li>
                <li><strong className="text-zinc-700">Wybierz i wskaż cel:</strong> kliknij kartę, a następnie puste pole docelowe.</li>
              </ul>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-zinc-900 rounded-xl hover:bg-zinc-800 transition-colors shadow-sm"
        >
          Rozumiem, wracam do gry
        </button>
      </div>
    </div>
  );
};
