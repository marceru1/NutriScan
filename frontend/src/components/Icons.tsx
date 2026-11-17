// Ícones do Lucide (https://lucide.dev), os mesmos do protótipo.
// Requer: npm install lucide-react-native react-native-svg
// Para trocar um ícone, mude só o import e a linha correspondente aqui.
import {
  Camera as LucideCamera,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Compass,
  Search,
  X,
} from 'lucide-react-native';
import { colors } from '../theme';

interface IconeProps {
  size?: number;
  color?: string;
}

export const IconeBusca = ({ size = 20, color = colors.subtle }: IconeProps) => (
  <Search size={size} color={color} strokeWidth={2} />
);
export const Voltar = ({ size = 28, color = colors.text }: IconeProps) => (
  <ChevronLeft size={size} color={color} strokeWidth={2} />
);
export const Avancar = ({ size = 24, color = colors.text }: IconeProps) => (
  <ChevronRight size={size} color={color} strokeWidth={2} />
);
export const Fechar = ({ size = 24, color = colors.text }: IconeProps) => (
  <X size={size} color={color} strokeWidth={2} />
);
export const Compasso = ({ size = 24, color = colors.text }: IconeProps) => (
  <Compass size={size} color={color} strokeWidth={2} />
);
export const Camera = ({ size = 24, color = colors.text }: IconeProps) => (
  <LucideCamera size={size} color={color} strokeWidth={2} />
);
export const IconeAlerta = ({ size = 18, color = colors.primary }: IconeProps) => (
  <CircleAlert size={size} color={color} strokeWidth={2} />
);
