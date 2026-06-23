import FileExplorer from '@/components/files/FileExplorer'

export function generateMetadata({ params }) {
  const pathStr = params?.path?.join('/') ?? ''
  return { title: `/${pathStr} — MultiImageLink Generator` }
}

export default function NestedFilesPage({ params }) {
  const path = params?.path ?? []
  return <FileExplorer path={path} />
}
