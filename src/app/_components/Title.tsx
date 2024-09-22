'use client';

import { Heading, keyframes, usePrefersReducedMotion } from '@chakra-ui/react';
import NounsSparklesSharp from '@/components/icons/NounsSparklesSharp';

const spin = keyframes`
  0% { opacity: 0; }
  6% { opacity: 1; }
  94% { opacity: 1; }
  100% { opacity: 0; }
`;

export default function Title() {
  const prefersReducedMotion = usePrefersReducedMotion();

  const animation = prefersReducedMotion
    ? undefined
    : `${spin} infinite 3s linear`;
  return (
    <Heading mb="4px" position="relative">
      NounsPilot
      <NounsSparklesSharp
        boxSize="72px"
        fill="primary"
        position="absolute"
        top="-55px"
        right="-55px"
        animation={animation}
      />
    </Heading>
  );
}
