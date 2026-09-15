import { BODY_PARTS, findFace, findHat, rgbaToHex, type PlayerData } from "@/lib/catalog";

// Classic flat front view of the avatar: body colors, face and hat. Same order as BODY_PARTS.
// Seen from the front, so the character's left arm and leg are on the viewer's right.
// ponytail: 2D only, so body part bundles (like Female) don't change the shape. A 3D preview
// would need the Unity models exported to glTF and three.js.
const RECTS = [
  [75, 0, 50, 50], // Head
  [50, 55, 100, 100], // Torso
  [155, 55, 45, 100], // Left Arm
  [0, 55, 45, 100], // Right Arm
  [102, 160, 48, 100], // Left Leg
  [50, 160, 48, 100], // Right Leg
];

export default function Avatar({
  data,
  width = 200,
  selected,
  onPartClick,
}: {
  data: PlayerData;
  width?: number;
  selected?: number[];
  onPartClick?: (part: number) => void;
}) {
  const face = findFace(data.face);
  const hat = findHat(data.hat);
  return (
    <svg viewBox="-10 -45 220 315" width={width} height={(width * 315) / 220} role="img" aria-label="Avatar">
      {RECTS.map(([x, y, w, h], i) => {
        const isSelected = selected?.includes(i);
        return (
          <rect
            key={BODY_PARTS[i]}
            x={x}
            y={y}
            width={w}
            height={h}
            rx={i === 0 ? 10 : 3}
            fill={rgbaToHex(data.bodyColors[i])}
            stroke={isSelected ? "#0b6fc4" : "rgba(0,0,0,0.3)"}
            strokeWidth={isSelected ? 4 : 1}
            className={onPartClick ? "cursor-pointer" : undefined}
            onClick={onPartClick ? () => onPartClick(i) : undefined}
          >
            <title>{BODY_PARTS[i]}</title>
          </rect>
        );
      })}
      <image href={face.image} x={75} y={0} width={50} height={50} pointerEvents="none" />
      {hat && <image href={hat.image} x={55} y={-45} width={90} height={65} pointerEvents="none" />}
    </svg>
  );
}
