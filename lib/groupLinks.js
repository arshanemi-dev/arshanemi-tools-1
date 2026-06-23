export function sortUrls(urls, sortBy) {
  const name  = u => u.split('/').pop()?.split('?')[0] ?? ''
  const count = u => parseInt(name(u).match(/\d+/)?.[0] ?? '0', 10)

  if (sortBy === 'name-asc')  return [...urls].sort((a, b) => name(a).localeCompare(name(b)))
  if (sortBy === 'name-desc') return [...urls].sort((a, b) => name(b).localeCompare(name(a)))
  if (sortBy === 'count')     return [...urls].sort((a, b) => count(a) - count(b))
  return urls // 'date' → keep API order (Dropbox returns by modified date)
}

export function groupLinks(urls, groupSize) {
  const groups = []
  for (let i = 0; i < urls.length; i += groupSize) {
    groups.push(urls.slice(i, i + groupSize))
  }
  return groups
}

export function toExcelTSV(groups) {
  return groups.map(row => row.join('\t')).join('\n')
}

export function toJSON(groups) {
  return JSON.stringify(groups, null, 2)
}
