import { applyDateRange, applyEquals, assertResult, supabase } from '../lib/supabase.js';

export function createCrudService({ table, validateCreate, validateUpdate = validateCreate, dateColumn, filterMap = {} }) {
  return {
    async list(filters = {}) {
      let query = supabase.from(table).select('*').order('created_at', { ascending: false });
      query = applyEquals(query, filters, filterMap);
      if (dateColumn) query = applyDateRange(query, dateColumn, filters);
      return assertResult(await query) || [];
    },
    async get(id) {
      const row = assertResult(await supabase.from(table).select('*').eq('id', id).maybeSingle());
      if (!row) throw new Error(`${table} record was not found.`);
      return row;
    },
    async create(input) {
      const payload = validateCreate ? validateCreate(input) : input;
      return assertResult(await supabase.from(table).insert(payload).select().single());
    },
    async update(id, input) {
      const payload = validateUpdate ? validateUpdate(input, true) : input;
      return assertResult(await supabase.from(table).update(payload).eq('id', id).select().single());
    },
    async remove(id) {
      await this.get(id);
      assertResult(await supabase.from(table).delete().eq('id', id));
      return { id };
    },
  };
}
