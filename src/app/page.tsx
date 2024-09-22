import { Center, Text } from '@chakra-ui/react';
import { DynamicBridgeWidget } from '@dynamic-labs/sdk-react-core';
// import AccountInfo from './_components/AccountInfo';
import Protocols from './_components/Protocols';
import Title from './_components/Title';

export default async function Home() {
  return (
    <Center
      py="64px"
      pt="120px"
      px="120px"
      maxWidth="1440px"
      minHeight="100vh"
      margin="0 auto"
      flexDirection="column"
    >
      <Title />
      <Text as="h3" fontSize="16px" mb="16px" fontWeight="bold">
        Just sit back and watch your funds grow ⌐✦-✦
      </Text>
      <Text as="h3" fontSize="24px" mb="32px">
        ⌐🧑‍✈️-🧑‍✈️
      </Text>
      <DynamicBridgeWidget />
      {/* <AccountInfo /> */}
      <Protocols />
    </Center>
  );
}
