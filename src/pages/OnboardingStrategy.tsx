import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoGerenciaRoi from '@/assets/Logo_gerencia_roi.png';

const strategies = [
  { id: 'pagina-vendas', label: 'Página de Vendas' },
  { id: 'typebot', label: 'Typebot' },
  { id: 'anuncio-whatsapp', label: 'Anúncio -> WhatsApp' },
  { id: 'anuncio-presell-whatsapp', label: 'Anúncio -> Pré Sell -> WhatsApp' },
  { id: 'outras', label: 'Outras' },
];

export default function OnboardingStrategy() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);

  const handleContinue = () => {
    if (selected) {
      navigate('/integrations');
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(220,20%,10%)] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-3">
          <img src={logoGerenciaRoi} alt="Gerencia ROI" className="h-10 w-10 object-contain" />
          <span className="text-white font-bold text-xl tracking-tight">Gerencia ROI</span>
        </div>
        <button
          onClick={() => navigate('/integrations')}
          className="text-sm text-muted-foreground hover:text-white underline underline-offset-2 transition-colors"
        >
          Pular Configuração
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md space-y-6">
          <h1 className="text-white text-xl font-semibold text-center leading-snug">
            Quais estratégias abaixo você vai utilizar<br />para vender nesse dashboard?
          </h1>

          <div className="space-y-3">
            {strategies.map((strategy) => (
              <button
                key={strategy.id}
                onClick={() => setSelected(strategy.id)}
                className={`w-full flex items-center gap-3 px-5 py-4 rounded-lg border text-left transition-all
                  ${selected === strategy.id
                    ? 'border-primary bg-primary/10 text-white'
                    : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:border-white/20'
                  }`}
              >
                <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                  ${selected === strategy.id ? 'border-primary' : 'border-white/30'}`}>
                  {selected === strategy.id && (
                    <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                  )}
                </span>
                <span className="font-medium text-sm">{strategy.label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={handleContinue}
            disabled={!selected}
            className={`w-full py-4 rounded-lg font-semibold text-sm transition-all
              ${selected
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer'
                : 'bg-white/10 text-white/30 cursor-not-allowed'
              }`}
          >
            Continuar
          </button>
        </div>
      </main>
    </div>
  );
}
