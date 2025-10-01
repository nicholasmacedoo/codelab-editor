/**
 * Configuração de tema da Lab365
 * Cores baseadas na identidade visual da Lab365
 */

export const temaLab365 = {
  cores: {
    primary: "#6E00B3",     // Roxo principal (baseado no gradiente do slide)
    secondary: "#FF5A3D",   // Laranja avermelhado do gradiente
    background: "#0F1115",  // Fundo escuro neutro
    surface: "#151822",     // Superfícies (cards, painéis)
    accent: "#F72585",      // Rosa vibrante (ponto de contraste)
    success: "#5EE2A0",     // Verde (sucesso)
    error: "#FF4D6D",       // Vermelho/rosa para erros
    text: "#EAEAF0",        // Texto principal (quase branco)
    muted: "#A0A0B2",       // Texto secundário
  },
  espacamento: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
    "2xl": "3rem",
  },
  bordas: {
    radius: {
      sm: "0.375rem",
      md: "0.5rem",
      lg: "0.75rem",
      xl: "1rem",
    },
  },
  sombras: {
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    glow: "0 0 20px rgba(110, 0, 179, 0.3)",
  },
  transicoes: {
    rapida: "150ms ease-in-out",
    media: "300ms ease-in-out",
    lenta: "500ms ease-in-out",
  },
};

/**
 * Variáveis CSS para uso global
 */
export const variaveisCss = `
  :root {
    --cor-primary: ${temaLab365.cores.primary};
    --cor-secondary: ${temaLab365.cores.secondary};
    --cor-background: ${temaLab365.cores.background};
    --cor-surface: ${temaLab365.cores.surface};
    --cor-accent: ${temaLab365.cores.accent};
    --cor-success: ${temaLab365.cores.success};
    --cor-error: ${temaLab365.cores.error};
    --cor-text: ${temaLab365.cores.text};
    --cor-muted: ${temaLab365.cores.muted};
    
    --espacamento-xs: ${temaLab365.espacamento.xs};
    --espacamento-sm: ${temaLab365.espacamento.sm};
    --espacamento-md: ${temaLab365.espacamento.md};
    --espacamento-lg: ${temaLab365.espacamento.lg};
    --espacamento-xl: ${temaLab365.espacamento.xl};
    --espacamento-2xl: ${temaLab365.espacamento["2xl"]};
    
    --borda-radius-sm: ${temaLab365.bordas.radius.sm};
    --borda-radius-md: ${temaLab365.bordas.radius.md};
    --borda-radius-lg: ${temaLab365.bordas.radius.lg};
    --borda-radius-xl: ${temaLab365.bordas.radius.xl};
    
    --sombra-sm: ${temaLab365.sombras.sm};
    --sombra-md: ${temaLab365.sombras.md};
    --sombra-lg: ${temaLab365.sombras.lg};
    --sombra-glow: ${temaLab365.sombras.glow};
    
    --transicao-rapida: ${temaLab365.transicoes.rapida};
    --transicao-media: ${temaLab365.transicoes.media};
    --transicao-lenta: ${temaLab365.transicoes.lenta};
  }
`;

/**
 * Classes utilitárias para uso nos componentes
 */
export const classesUtilitarias = {
  // Backgrounds
  bgPrimary: "bg-[var(--cor-primary)]",
  bgSecondary: "bg-[var(--cor-secondary)]",
  bgBackground: "bg-[var(--cor-background)]",
  bgSurface: "bg-[var(--cor-surface)]",
  bgAccent: "bg-[var(--cor-accent)]",
  bgSuccess: "bg-[var(--cor-success)]",
  bgError: "bg-[var(--cor-error)]",
  
  // Textos
  textPrimary: "text-[var(--cor-text)]",
  textMuted: "text-[var(--cor-muted)]",
  textAccent: "text-[var(--cor-accent)]",
  textSuccess: "text-[var(--cor-success)]",
  textError: "text-[var(--cor-error)]",
  
  // Bordas
  borderPrimary: "border-[var(--cor-primary)]",
  borderSurface: "border-[var(--cor-surface)]",
  borderAccent: "border-[var(--cor-accent)]",
  
  // Hover states
  hoverPrimary: "hover:bg-[var(--cor-primary)]",
  hoverSurface: "hover:bg-[var(--cor-surface)]",
  hoverAccent: "hover:bg-[var(--cor-accent)]",
  
  // Transições
  transicaoRapida: "transition-all duration-150 ease-in-out",
  transicaoMedia: "transition-all duration-300 ease-in-out",
  transicaoLenta: "transition-all duration-500 ease-in-out",
};

export type TemaLab365 = typeof temaLab365;
export type ClassesUtilitarias = typeof classesUtilitarias;