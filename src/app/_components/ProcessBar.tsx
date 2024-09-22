import { Center, Image as ChakraImage, Flex, Text } from '@chakra-ui/react';
import Image from 'next/image';
import { useChainId } from 'wagmi';

export default function ProcessBar({
  strategyChainId,
  strategyName,
}: {
  strategyChainId: number;
  strategyName: string;
}) {
  const connectedChainId = useChainId();

  return (
    <Flex width="50%">
      {connectedChainId !== strategyChainId ? (
        <Center
          width="80px"
          height="0px"
          borderBottom="2px dashed"
          borderColor="brand.lighter"
          position="relative"
          flexDirection="row"
          gap="4px"
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
            width={24}
            height={24}
          />
          <ChakraImage
            src="https://asset-images.messari.io/images/93cfc3a4-e661-43cd-8503-7a2e798d1946/64.png"
            alt="LayerZero"
            boxSize="24px"
            borderRadius="50%"
          />
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
          width={24}
          height={24}
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
