import type { SortDirection, SortField } from '@/composables/useTestTable'
import type { TestTableRow } from '@/types/database'
import { sqliteService } from '@/services/sqlite'
import { DatabaseError } from '@/utils/errors'

export function createTestTableRepository() {
  async function initialize(): Promise<boolean> {
    return await sqliteService.initialize()
  }

  async function getAll(): Promise<TestTableRow[]> {
    const result = await sqliteService.executeWithRows<any[]>(
      'SELECT * FROM test_table',
    )
    return result?.map(row => ({
      id: row[0],
      name: row[1],
      created_at: row[2],
    }))
  }

  async function create(name: string): Promise<void> {
    if (!name.trim())
      throw new Error('Name cannot be empty')
    await sqliteService.execute(
      'INSERT INTO test_table (name) VALUES (?)',
      [name],
    )
  }

  async function delete_(id: number): Promise<void> {
    await sqliteService.execute(
      'DELETE FROM test_table WHERE id = ?',
      [id],
    )
  }

  async function executeRawQuery(query: string): Promise<any> {
    try {
      return await sqliteService.executeWithRows(query)
    }
    catch (err: unknown) {
      const error = err as Error
      throw new DatabaseError(`Failed to execute raw query: ${error.message}`)
    }
  }

  function sortItems(items: TestTableRow[], field: SortField, direction: SortDirection): TestTableRow[] {
    return [...items].sort((a, b) => {
      const aValue = a[field]
      const bValue = b[field]

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }

      return direction === 'asc'
        ? Number(aValue) - Number(bValue)
        : Number(bValue) - Number(aValue)
    })
  }

  function isModificationQuery(query: string): boolean {
    const lowerQuery = query.toLowerCase().trim()
    return (
      lowerQuery.startsWith('insert')
      || lowerQuery.startsWith('update')
      || lowerQuery.startsWith('delete')
    )
  }

  return {
    initialize,
    getAll,
    create,
    delete: delete_,
    executeRawQuery,
    sortItems,
    isModificationQuery,
  }
}

export const testTableRepository = createTestTableRepository()
