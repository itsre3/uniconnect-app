import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

interface UniConnectLogoProps {
  size?: number;
  leftColor: string;
  rightColor: string;
}

export function UniConnectLogo({
  size = 96,
  leftColor,
  rightColor,
}: UniConnectLogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      {/* Right Lavender Wave */}
      <Path
        d="M 43 79 C 56 79, 60 52, 72 52 C 81 52, 85 59, 85 67 C 85 73, 80 77, 75 77 C 70 77, 67 73, 66 69 C 62 75, 54 83, 43 83 Z"
        fill={rightColor}
      />
      {/* Right Lavender Dot */}
      <Circle cx="73" cy="34" r="8.5" fill={rightColor} />

      {/* Left Primary Stroke */}
      <Path
        d="M 27 44 C 33.5 44, 38 48.5, 38 55 C 38 64, 41 69, 47 71 C 52 72.5, 54 77.5, 51 81 C 48.5 83.5, 44 83.5, 40 82.5 C 24 78.5, 16 66, 16 55 C 16 48.5, 20.5 44, 27 44 Z"
        fill={leftColor}
      />
      {/* Left Primary Dot */}
      <Circle cx="27" cy="27" r="10" fill={leftColor} />
    </Svg>
  );
}
