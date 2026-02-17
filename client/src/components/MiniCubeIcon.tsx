/**
 * MiniCubeIcon — Visual face rotation icons
 * ==========================================
 * Design: Neon Arcade — Cyberpunk Gaming Aesthetic
 *
 * Each icon renders a small isometric cube with:
 * - The target face highlighted in a bright color
 * - A curved arrow showing the rotation direction (CW or CCW)
 * - Other faces shown in muted gray for context
 *
 * Faces: U (top), D (bottom), F (front), B (back), L (left), R (right)
 */

import React from 'react';

type FaceId = 'U' | 'D' | 'F' | 'B' | 'L' | 'R';

interface MiniCubeIconProps {
  face: FaceId;
  prime: boolean; // true = counter-clockwise (')
  size?: number;
}

/**
 * We draw a simplified isometric cube showing 3 visible faces (top, left, right)
 * and highlight the relevant face. An arrow overlay shows rotation direction.
 *
 * The cube is drawn in a 40x40 viewBox with an isometric projection.
 */
export function MiniCubeIcon({ face, prime, size = 40 }: MiniCubeIconProps) {
  // Face highlight color (cyan for the active face)
  const HL = 'rgba(0, 220, 255, 0.85)';
  const HL_DIM = 'rgba(0, 220, 255, 0.45)';
  // Muted face colors
  const TOP_DEFAULT = 'rgba(255,255,255,0.12)';
  const LEFT_DEFAULT = 'rgba(255,255,255,0.06)';
  const RIGHT_DEFAULT = 'rgba(255,255,255,0.09)';
  // Edge color
  const EDGE = 'rgba(255,255,255,0.2)';
  // Arrow color
  const ARROW = 'rgba(0, 240, 255, 0.9)';

  // Determine which of the 3 visible faces to highlight
  // For B and D faces, we show a "see-through" indicator since they're not directly visible
  let topColor = TOP_DEFAULT;
  let leftColor = LEFT_DEFAULT;
  let rightColor = RIGHT_DEFAULT;
  let showBackIndicator = false;
  let showBottomIndicator = false;

  switch (face) {
    case 'U': topColor = HL; break;
    case 'F': leftColor = HL; break;  // front face is the left-visible face in our isometric view
    case 'R': rightColor = HL; break;
    case 'L': leftColor = HL_DIM; showBackIndicator = false; break; // left is partially visible
    case 'B': showBackIndicator = true; break;
    case 'D': showBottomIndicator = true; break;
  }

  // For L face, we highlight the left visible face
  // For B face, we show dashed outline on the back
  // For D face, we show dashed outline on the bottom

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      {/* Isometric cube - center at (20, 20) */}
      {/* Points: top(20,6), left(6,16), right(34,16), front-left(6,30), bottom(20,36), front-right(34,30) */}

      {/* Top face */}
      <polygon
        points="20,6 34,14 20,22 6,14"
        fill={topColor}
        stroke={EDGE}
        strokeWidth="0.7"
      />

      {/* Left face (front-left) */}
      <polygon
        points="6,14 20,22 20,36 6,28"
        fill={face === 'F' ? HL : face === 'L' ? HL_DIM : leftColor}
        stroke={EDGE}
        strokeWidth="0.7"
      />

      {/* Right face (front-right) */}
      <polygon
        points="20,22 34,14 34,28 20,36"
        fill={rightColor}
        stroke={EDGE}
        strokeWidth="0.7"
      />

      {/* Back face indicator (dashed) */}
      {showBackIndicator && (
        <>
          {/* Highlight the back with a glow effect */}
          <polygon
            points="20,6 34,14 34,28 20,36 6,28 6,14"
            fill="none"
            stroke={HL}
            strokeWidth="1.5"
            strokeDasharray="3 2"
            opacity={0.6}
          />
          {/* Small "B" label */}
          <line x1="20" y1="6" x2="20" y2="2" stroke={HL} strokeWidth="1" opacity={0.5} />
        </>
      )}

      {/* Bottom face indicator (dashed) */}
      {showBottomIndicator && (
        <>
          <polygon
            points="6,28 20,36 34,28 20,20"
            fill={HL_DIM}
            stroke={HL}
            strokeWidth="1"
            strokeDasharray="2 2"
            opacity={0.7}
          />
        </>
      )}

      {/* Rotation arrow */}
      <RotationArrow face={face} prime={prime} color={ARROW} />
    </svg>
  );
}

/**
 * Draws a curved arrow around the highlighted face to show rotation direction.
 */
function RotationArrow({ face, prime, color }: { face: FaceId; prime: boolean; color: string }) {
  // Each face gets an arrow positioned around it
  // CW = clockwise arrow, CCW (prime) = counter-clockwise arrow

  switch (face) {
    case 'U':
      return <TopArrow prime={prime} color={color} />;
    case 'D':
      return <BottomArrow prime={prime} color={color} />;
    case 'F':
      return <FrontArrow prime={prime} color={color} />;
    case 'B':
      return <BackArrow prime={prime} color={color} />;
    case 'L':
      return <LeftArrow prime={prime} color={color} />;
    case 'R':
      return <RightArrow prime={prime} color={color} />;
  }
}

function TopArrow({ prime, color }: { prime: boolean; color: string }) {
  // Arrow circling around the top face
  if (prime) {
    return (
      <g>
        <path
          d="M 14,8 C 10,11 10,16 16,18"
          fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round"
        />
        <polygon points="14,7 11,10 16,10" fill={color} />
      </g>
    );
  }
  return (
    <g>
      <path
        d="M 26,8 C 30,11 30,16 24,18"
        fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round"
      />
      <polygon points="26,7 29,10 24,10" fill={color} />
    </g>
  );
}

function BottomArrow({ prime, color }: { prime: boolean; color: string }) {
  if (prime) {
    return (
      <g>
        <path
          d="M 14,33 C 10,30 10,25 16,24"
          fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round"
        />
        <polygon points="14,34 11,31 16,31" fill={color} />
      </g>
    );
  }
  return (
    <g>
      <path
        d="M 26,33 C 30,30 30,25 24,24"
        fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round"
      />
      <polygon points="26,34 29,31 24,31" fill={color} />
    </g>
  );
}

function FrontArrow({ prime, color }: { prime: boolean; color: string }) {
  // Arrow on the left (front) face - vertical rotation
  if (prime) {
    return (
      <g>
        <path
          d="M 8,17 C 5,22 5,27 10,30"
          fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round"
        />
        <polygon points="7,16 5,20 10,18" fill={color} />
      </g>
    );
  }
  return (
    <g>
      <path
        d="M 8,29 C 5,24 5,19 10,16"
        fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round"
      />
      <polygon points="7,30 5,26 10,28" fill={color} />
    </g>
  );
}

function BackArrow({ prime, color }: { prime: boolean; color: string }) {
  if (prime) {
    return (
      <g>
        <path
          d="M 32,17 C 35,22 35,27 30,30"
          fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round"
        />
        <polygon points="33,16 35,20 30,18" fill={color} />
      </g>
    );
  }
  return (
    <g>
      <path
        d="M 32,29 C 35,24 35,19 30,16"
        fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round"
      />
      <polygon points="33,30 35,26 30,28" fill={color} />
    </g>
  );
}

function LeftArrow({ prime, color }: { prime: boolean; color: string }) {
  if (prime) {
    return (
      <g>
        <path
          d="M 8,17 C 5,22 5,27 10,30"
          fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round"
        />
        <polygon points="7,16 5,20 10,18" fill={color} />
      </g>
    );
  }
  return (
    <g>
      <path
        d="M 8,29 C 5,24 5,19 10,16"
        fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round"
      />
      <polygon points="7,30 5,26 10,28" fill={color} />
    </g>
  );
}

function RightArrow({ prime, color }: { prime: boolean; color: string }) {
  if (prime) {
    return (
      <g>
        <path
          d="M 32,17 C 35,22 35,27 30,30"
          fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round"
        />
        <polygon points="33,16 35,20 30,18" fill={color} />
      </g>
    );
  }
  return (
    <g>
      <path
        d="M 32,29 C 35,24 35,19 30,16"
        fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round"
      />
      <polygon points="33,30 35,26 30,28" fill={color} />
    </g>
  );
}

export default MiniCubeIcon;
