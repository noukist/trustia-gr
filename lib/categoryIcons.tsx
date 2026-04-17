// =============================================================
// lib/categoryIcons.tsx — Shared Lucide icon map for categories
// =============================================================
// Maps category IDs from constants.ts to Lucide icon components.
// Use this everywhere you display a category visually (cards,
// headers, profile pages). For HTML <select>/<option> elements,
// keep using cat.emoji since React components can't render there.
//
// Usage:
//   import { getCategoryIcon } from "@/lib/categoryIcons";
//   const Icon = getCategoryIcon("plumber");
//   <Icon className="w-6 h-6" />
// =============================================================

import {
  Wrench, Zap, Sparkles, Paintbrush, Wind, Scissors,
  Hammer, Snowflake, Key, Truck, Bug, Sofa, Plug,
  DoorOpen, Droplets, Ruler, TreePine, Shirt, Dog,
  Package, Building2, Home, Landmark, Palette, Sun,
  Smartphone, CookingPot, Layers, Flame, ArrowUpDown
  Waves, Fence, Shovel, ShieldCheck, Eye, Camera,
  Blinds, Pipette, type LucideIcon,
} from "lucide-react";

// ── Map every category ID to a Lucide icon ──
// Category IDs match those in lib/constants.ts
const ICON_MAP: Record<string, LucideIcon> = {
  // Light services
  "house-cleaning": Sparkles,
  "office-cleaning": Building2,
  "ironing": Shirt,
  "gardening": TreePine,
  "pet-sitting": Dog,
  "small-moving": Package,

  // Trades & Beauty
  "plumber": Wrench,
  "electrician": Zap,
  "painter": Paintbrush,
  "general-repairs": Hammer,
  "hvac": Snowflake,
  "locksmith": Key,
  "moving": Truck,
  "pest-control": Bug,
  "furniture-assembly": Sofa,
  "appliance-repair": Plug,
  "windows-aluminum": Blinds,
  "awnings": Sun,
  "security-doors": DoorOpen,
  "drains": Droplets,
  "drywall": Ruler,
  "flooring": Layers,
  "tiles": Layers,
  "plastering": Hammer,
  "carpentry": Hammer,
  "metalwork": Fence,
  "heating": Flame,
  "wallpaper": Palette,
  "glass": Blinds,
  "alarms-cameras": Camera,
  "shutters": Blinds,
  "nail-tech": Scissors,
  "makeup": Palette,
  "hairdresser": Scissors,
  "lashes-brows": Eye,

  // Specialists
  "renovation": Home,
  "architect": Landmark,
  "civil-engineer": Building2,
  "interior-designer": Palette,
  "solar": Sun,
  "smart-home": Smartphone,
  "kitchen-bath": CookingPot,
  "insulation": Layers,
  "structural": Building2,
  "fireplace": Flame,
  "elevator": ArrowUpDown
  "pool": Waves,
  "fencing": Fence,
  "excavation": Shovel,
};

// ── Get the Lucide icon for a category ID ──
// Falls back to ShieldCheck if the category ID isn't mapped
export function getCategoryIcon(categoryId: string): LucideIcon {
  return ICON_MAP[categoryId] || ShieldCheck;
}