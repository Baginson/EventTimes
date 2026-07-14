const DEFAULT_SEARCH_RESULT_LIMIT = 8

export function normalizeSearchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pl-PL')
    .replace(/ł/g, 'l')
    .trim()
}

export function matchesTokenPrefix(name: string, query: string) {
  const nameTokens = normalizeSearchText(name).split(/[^a-z0-9]+/).filter(Boolean)
  const queryTokens = normalizeSearchText(query).split(/[^a-z0-9]+/).filter(Boolean)

  return queryTokens.every((queryToken) =>
    nameTokens.some((nameToken) => nameToken.startsWith(queryToken)),
  )
}

export function uniqueById<T extends { id: string }>(items: T[]) {
  const seenIds = new Set<string>()

  return items.filter((item) => {
    if (seenIds.has(item.id)) {
      return false
    }

    seenIds.add(item.id)
    return true
  })
}

export function limitSearchResults<T>(items: T[], limit = DEFAULT_SEARCH_RESULT_LIMIT) {
  return items.slice(0, limit)
}
