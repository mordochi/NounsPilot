'use client';

import { extendTheme } from '@chakra-ui/react';
import { Nunito, Press_Start_2P, Silkscreen } from 'next/font/google';

const pressStart2P = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

const silkscreen = Silkscreen({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

const nunito = Nunito({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

const theme = extendTheme({
  fonts: {
    heading: `${pressStart2P.style.fontFamily}, sans-serif`,
    body: `${nunito.style.fontFamily}, sans-serif`,
    silkscreen: `${silkscreen.style.fontFamily}, sans-serif`,
  },
  colors: {
    // Colors from Nouns palette: https://noundation.xyz/styles/colors
    primary: '#292F32',
    secondary: '#F5FCFF',
    brand: {
      lighter: '#E5E5DE',
      light: '#ADC8CC',
      regular: '#769CA9',
    },
  },
  styles: {
    global: {
      body: {
        color: 'primary',
      },
      '*': {
        boxSizing: 'border-box',
        padding: '0',
        margin: '0',
      },
    },
  },
});

export default theme;
