import { Icon } from "@/components/icons";

export function UnitArtwork({ unitId, className = "" }: { unitId: string; className?: string }) {
  return <div aria-hidden="true" className={`unit-artwork unit-artwork--${unitId} ${className}`}><div className="unit-artwork-grain"/><Icon name={unitId === "edo" ? "lantern" : unitId === "kamakura" ? "mountain" : unitId === "sengoku" ? "castle" : "flame"} size={32}/></div>;
}
