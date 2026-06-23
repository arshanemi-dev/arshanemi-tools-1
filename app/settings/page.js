import ConnectedSettings from '@/components/settings/ConnectedSettings'
import LocalModeSettings  from '@/components/settings/LocalModeSettings'

export const metadata = { title: 'Settings — MultiImageLink Generator' }

const IS_CONNECT = process.env.NEXT_PUBLIC_IS_CONNECT?.toLowerCase() === 'true'

export default function SettingsPage() {
  return IS_CONNECT ? <ConnectedSettings /> : <LocalModeSettings />
}
