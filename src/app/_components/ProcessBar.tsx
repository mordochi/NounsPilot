import { Center, Flex, Image, Text } from '@chakra-ui/react';
import { useChainId } from 'wagmi';

export default function ProcessBar({
  strategyChainId,
  strategyName,
  isSwapNeeded,
}: {
  strategyChainId: number;
  strategyName: string;
  isSwapNeeded: boolean;
}) {
  const connectedChainId = useChainId();

  return (
    <Flex width="50%">
      {connectedChainId !== strategyChainId || isSwapNeeded ? (
        <Center
          width="100px"
          height="0px"
          borderBottom="2px dashed"
          borderColor="brand.lighter"
          position="relative"
          flexDirection="row"
          gap="0px"
          _before={{
            display: 'block',
            content: '""',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            bg: 'brand.lighter',
            position: 'absolute',
            top: '50%',
            left: '0',
            transform: 'translate(-50%, calc(-50% + 1px))',
          }}
          _after={{
            display: 'block',
            content: '""',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            bg: 'brand.lighter',
            position: 'absolute',
            top: '50%',
            right: '0',
            transform: 'translate(50%, calc(-50% + 1px))',
          }}
        >
          <Image
            src={`/images/${connectedChainId}.svg`}
            alt={`Chain icon for ${connectedChainId}`}
            boxSize="24px"
            transform={
              isSwapNeeded && connectedChainId !== strategyChainId
                ? 'translateX(8px)'
                : 'translateX(4px)'
            }
          />
          {isSwapNeeded ? (
            <Image
              src="/images/1inch.png"
              alt="1inch"
              boxSize="24px"
              borderRadius="50%"
              position="relative"
              zIndex={1}
              transform={
                connectedChainId !== strategyChainId
                  ? 'none'
                  : 'translateX(-4px)'
              }
            />
          ) : null}
          {connectedChainId !== strategyChainId ? (
            <Image
              src="https://asset-images.messari.io/images/93cfc3a4-e661-43cd-8503-7a2e798d1946/64.png"
              alt="LayerZero"
              boxSize="24px"
              borderRadius="50%"
              transform="translateX(-8px)"
              zIndex={2}
            />
          ) : null}
        </Center>
      ) : null}

      <Center
        flex="1"
        height="0px"
        borderBottom="2px dashed"
        borderColor="brand.lighter"
        position="relative"
        flexDirection="column"
        gap="6px"
        _before={{
          display: 'block',
          content: '""',
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          bg: 'brand.lighter',
          position: 'absolute',
          top: '50%',
          left: '0',
          transform: 'translate(-50%, calc(-50% + 1px))',
        }}
        _after={{
          display: 'block',
          content: '""',
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          bg: 'brand.lighter',
          position: 'absolute',
          top: '50%',
          right: '0',
          transform: 'translate(50%, calc(-50% + 1px))',
        }}
      >
        <Image
          src={`/images/${strategyChainId}.svg`}
          alt={`Chain icon for ${strategyChainId}`}
          boxSize="24px"
        />
        <Text
          display="inline-block"
          fontWeight="bold"
          padding="0 8px"
          lineHeight="22px"
          bg="brand.lighter"
          borderRadius="4px"
          transform="translate(0, 1px)"
        >
          {strategyName}
        </Text>
      </Center>
    </Flex>
  );
}
