/**
 * Icon registry — maps the string icon names stored in the JSON page-data
 * (e.g. "sparkles") to real lucide-react components.
 *
 * Why a registry instead of storing components in JSON?
 *   JSON is the Single Source of Truth and must be serializable, so it can
 *   only store strings. This registry is the single place that resolves a
 *   string → component, used by both the in-app Canvas and the generated
 *   Vite project (which imports the same names from lucide-react).
 *
 * Using named ESM imports (not the UMD global) is what fixes the
 * "Cannot read properties of undefined reading 'forwardRef'" error: the
 * app's own tree is bundled by Vite, so React.forwardRef is always in
 * scope for lucide-react. The error only ever happened inside the
 * in-browser Babel preview, which this architecture removes entirely.
 */
import {
  Sparkles,
  Layers,
  Rocket,
  Zap,
  Star,
  Shield,
  Globe,
  Heart,
  Check,
  ArrowRight,
  Mail,
  Phone,
  Users,
  Code,
  Palette,
  Gauge,
  Lock,
  MessageSquare,
} from "lucide-react";

const REGISTRY = {
  sparkles: Sparkles,
  layers: Layers,
  rocket: Rocket,
  zap: Zap,
  star: Star,
  shield: Shield,
  globe: Globe,
  heart: Heart,
  check: Check,
  arrow: ArrowRight,
  mail: Mail,
  phone: Phone,
  users: Users,
  code: Code,
  palette: Palette,
  gauge: Gauge,
  lock: Lock,
  message: MessageSquare,
};

/**
 * Resolve an icon name to a lucide-react component.
 * Falls back to Sparkles for unknown names so rendering never throws.
 *
 * @param {string} name
 * @returns {React.ComponentType<{ className?: string }>}
 */
export function getIcon(name) {
  return REGISTRY[String(name || "").toLowerCase()] || Sparkles;
}

/** All registered icon names (used by the generated project + editor UI). */
export const ICON_NAMES = Object.keys(REGISTRY);

export default REGISTRY;
