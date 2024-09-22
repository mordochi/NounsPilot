import { Center } from '@chakra-ui/react';
import { DynamicBridgeWidget } from '@dynamic-labs/sdk-react-core';
import AccountInfo from './_components/AccountInfo';
import Assets from './_components/Assets';

export default async function Home() {
  return (
    <Center minHeight="100vh" flexDirection="column">
      <DynamicBridgeWidget />
      <AccountInfo />
      <Assets />
    </Center>
  );
}
