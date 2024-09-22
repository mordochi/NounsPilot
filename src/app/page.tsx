import { Center, Heading, Text } from '@chakra-ui/react';
import { DynamicBridgeWidget } from '@dynamic-labs/sdk-react-core';
// import AccountInfo from './_components/AccountInfo';
import Protocols from './_components/Protocols';

export default async function Home() {
  return (
    <Center
      py="64px"
      px="120px"
      maxWidth="1440px"
      minHeight="100vh"
      margin="0 auto"
      flexDirection="column"
    >
      <Heading mb="16px">NounsPilot</Heading>
      <Text as="h3" fontSize="24px" mb="32px">
        ⌐🧑‍✈️-🧑‍✈️
      </Text>
      <DynamicBridgeWidget />
      {/* <AccountInfo /> */}
      <Protocols />
    </Center>
  );
}
