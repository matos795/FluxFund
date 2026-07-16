import type {
  CategoryResultGroup,
  CategoryResultItem,
} from "./reports-types"

export function groupCategoryResultItems(
  items: CategoryResultItem[],
): CategoryResultGroup[] {
  const groups = new Map<string, CategoryResultGroup>()

  for (const item of items) {
    const groupId =
      item.parentCategoryId ??
      item.categoryId ??
      `unclassified-${item.type}`
    const groupName = item.parentCategoryName ?? item.categoryName

    const existingGroup = groups.get(groupId)

    if (existingGroup) {
      existingGroup.total += item.total
      existingGroup.transactionCount += item.transactionCount
      existingGroup.children.push(item)

      continue
    }

    groups.set(groupId, {
      groupId,
      groupName,
      type: item.type,
      total: item.total,
      transactionCount: item.transactionCount,
      children: [item],
    })
  }

  return Array.from(groups.values())
}

export function filterCategoryResultGroups(
  groups: CategoryResultGroup[],
  search: string,
): CategoryResultGroup[] {
  const normalizedSearch = search.trim().toLowerCase()

  if (!normalizedSearch) {
    return groups
  }

  return groups
    .map((group) => {
      const groupMatches = group.groupName
        .toLowerCase()
        .includes(normalizedSearch)

      const matchingChildren = group.children.filter((child) =>
        child.categoryName.toLowerCase().includes(normalizedSearch),
      )

      if (groupMatches) {
        return group
      }

      if (matchingChildren.length > 0) {
        return {
          ...group,
          children: matchingChildren,
        }
      }

      return null
    })
    .filter((group): group is CategoryResultGroup => group !== null)
}