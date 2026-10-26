/**
 * plugins/vuetify.js
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Composables
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

// SVG Icons (assets/icons)
import IconArrivalChip from '@/assets/icons/icon-arrival-chip.svg?component'
import IconDepartChip from '@/assets/icons/icon-depart-chip.svg?component'
import IconParkingChip from '@/assets/icons/icon-parking-chip.svg?component'
import IconParkingMark from '@/assets/icons/icon-parking-mark.png?component'
import IconLocationMark from '@/assets/icons/icon-location-mark.png?component'

const customAliases = {
  ...aliases,
  'cus-arrival-chip': IconArrivalChip,
  'cus-depart-chip': IconDepartChip,
  'cus-parking-chip': IconParkingChip,
  'cus-parking-mark': IconParkingMark,
  'cus-location-mark': IconLocationMark,
}

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          surface: '#F9FAFB', // 배경색을 설정
          background: '#F9FAFB', // 배경색을 설정
        },
        variables: {
          'body-font-family': '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, "Helvetica Neue", "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif',
        },
      }
    }
  },
      
  icons: {
    defaultSet: 'mdi',
    aliases: customAliases,
    sets: {
      mdi,
    },
  }
})
