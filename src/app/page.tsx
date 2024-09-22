import { Center } from '@chakra-ui/react';
import { DynamicBridgeWidget } from '@dynamic-labs/sdk-react-core';
// import AccountInfo from './_components/AccountInfo';
import Assets from './_components/Assets';

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
      <DynamicBridgeWidget />
      {/* <AccountInfo /> */}
      <Assets />
    </Center>
  );
}
