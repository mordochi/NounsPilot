import { Center, Image, Text } from '@chakra-ui/react';

export default function TokenIcon({
  name,
  symbol,
  url,
}: {
  name: string;
  symbol: string;
  url?: string;
}) {
  return (
    <Center
      flex="0 0 auto"
      width="24px"
      height="24px"
      bg="brand.lighter"
      borderRadius="50%"
      color="brand.regular"
      fontWeight="bold"
      overflow="hidden"
    >
      {url ? (
        <Image
          src={url}
          alt={name}
          fallback={<Text>{symbol[0].toUpperCase()}</Text>}
          boxSize="24px"
        />
      ) : (
        symbol[0].toUpperCase()
      )}
    </Center>
  );
}
