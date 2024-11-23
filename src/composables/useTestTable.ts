import type { TestTableRow } from '@/types/database'
import { testTableRepository } from '@/repositories/testTableRepository'
import { ref, computed } from 'vue'

export type SortDirection = 'asc' | 'desc'
export type SortField = 'id' | 'name' | 'created_at'

export function useTestTable() {
  const isInitialized = ref(false)
  const items = ref<TestTableRow[]>([])
  const error = ref<string | null>(null)
  const isLoading = ref(false)
  const searchQuery = ref('')
  const sortField = ref<SortField>('id')
  const sortDirection = ref<SortDirection>('asc')

  const filteredAndSortedItems = computed(() => {
    let result = [...items.value]

    // Apply search filter
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      result = result.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.id.toString().includes(query)
      )
    }

    // Apply sorting
    result.sort((a, b) => {
      const aValue = a[sortField.value]
      const bValue = b[sortField.value]
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection.value === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }
      
      return sortDirection.value === 'asc'
        ? Number(aValue) - Number(bValue)
        : Number(bValue) - Number(aValue)
    })

    return result
  })

  async function initialize() {
    try {
      isInitialized.value = await testTableRepository.initialize()
      if (isInitialized.value)
        await loadItems()
      else
        error.value = 'SQLite initialization returned false'
    }
    catch (e) {
      error.value = `Failed to initialize database: ${(e as Error).message}`
    }
  }

  async function loadItems() {
    try {
      isLoading.value = true
      items.value = await testTableRepository.getAll()
    }
    catch (e) {
      error.value = `Failed to load data: ${(e as Error).message}`
    }
    finally {
      isLoading.value = false
    }
  }

  async function addItem(name: string) {
    if (!name.trim())
      return

    try {
      isLoading.value = true
      await testTableRepository.create(name)
      await loadItems()
    }
    catch (e) {
      error.value = `Failed to add item: ${(e as Error).message}`
    }
    finally {
      isLoading.value = false
    }
  }

  async function deleteItem(id: number) {
    try {
      isLoading.value = true
      await testTableRepository.delete(id)
      await loadItems()
    }
    catch (e) {
      error.value = `Failed to delete item: ${(e as Error).message}`
    }
    finally {
      isLoading.value = false
    }
  }

  function toggleSort(field: SortField) {
    if (sortField.value === field) {
      sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
    }
    else {
      sortField.value = field
      sortDirection.value = 'asc'
    }
  }

  function clearError() {
    error.value = null
  }

  return {
    isInitialized,
    items: filteredAndSortedItems,
    error,
    isLoading,
    searchQuery,
    sortField,
    sortDirection,
    initialize,
    loadItems,
    addItem,
    deleteItem,
    toggleSort,
    clearError,
  }
}