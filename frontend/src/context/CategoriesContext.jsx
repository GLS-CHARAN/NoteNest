import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as categoryService from '../services/categoryService.js';

const CategoriesContext = createContext(null);

// Shared by the sidebar, the editor and the settings page, so they always agree.
export function CategoriesProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try { setCategories(await categoryService.getCategories()); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh().catch(() => setLoading(false)); }, [refresh]);

  const add = useCallback(async (name) => { await categoryService.createCategory(name); await refresh(); }, [refresh]);
  const rename = useCallback(async (id, name) => { await categoryService.renameCategory(id, name); await refresh(); }, [refresh]);
  const remove = useCallback(async (id) => { await categoryService.deleteCategory(id); await refresh(); }, [refresh]);

  const value = useMemo(() => ({ categories, loading, add, rename, remove, refresh }), [categories, loading, add, rename, remove, refresh]);
  return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>;
}

export const useCategories = () => useContext(CategoriesContext);
