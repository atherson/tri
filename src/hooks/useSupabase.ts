import { useEffect, useState, useCallback } from 'react'
import { supabase, TABLES } from '@/lib/supabase'

export function useSupabaseQuery<T>(
  table: string,
  opts?: {
    select?: string
    filters?: Record<string, any>
    order?: { column: string; ascending?: boolean }
    limit?: number
    relations?: string
  },
) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    let query = supabase.from(table).select(opts?.select ?? '*')
    if (opts?.filters) {
      for (const [key, value] of Object.entries(opts.filters)) {
        if (value !== undefined && value !== null && value !== '') {
          query = query.eq(key, value)
        }
      }
    }
    if (opts?.order) {
      query = query.order(opts.order.column, { ascending: opts.order.ascending ?? true })
    }
    if (opts?.limit) {
      query = query.limit(opts.limit)
    }
    const { data: result, error: err } = await query
    if (err) {
      setError(err.message)
      setData([])
    } else {
      setData((result ?? []) as T[])
    }
    setLoading(false)
  }, [table, JSON.stringify(opts?.filters), opts?.select, opts?.order?.column, opts?.order?.ascending, opts?.limit])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

export function useSupabaseSingle<T>(
  table: string,
  id: string | undefined,
  select?: string,
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) { setLoading(false); return }
    setLoading(true)
    supabase.from(table).select(select ?? '*').eq('id', id).maybeSingle()
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setData(data as T)
        setLoading(false)
      })
  }, [table, id, select])

  return { data, loading, error }
}

export { supabase, TABLES }
