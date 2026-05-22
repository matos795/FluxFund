import type {
  CategoryResultGroup,
  CategoryResultItem,
} from "./reports-types"

export function groupCategoryResultItems(
  items: CategoryResultItem[],
): CategoryResultGroup[] {
  const groups = new Map<string, CategoryResultGroup>()

  for (const item of items) {
    const groupId = item.parentCategoryId ?? item.categoryId
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