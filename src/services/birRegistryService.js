import { assertResult, requireRecord, supabase } from '../lib/supabase.js';
import { createCrudService } from './baseService.js';

const base = createCrudService({ table: 'bir_registry', dateColumn: 'created_at', filterMap: { memberId: 'member_id', included: 'included' } });

function fromMember(member, overrides = {}) {
  return {
    member_id: member.id,
    surname: member.surname,
    given_name: member.given_name,
    middle_name: member.middle_name,
    tin: member.tin,
    birthdate: member.birthdate,
    barangay: member.barangay,
    municipality: member.municipality,
    province: overrides.province || member.extra_data?.province || 'Ilocos Sur',
    capital_share: Number(member.paid_up_share_capital || 0),
    included: overrides.included ?? true,
    remarks: overrides.remarks || null,
  };
}

export const birRegistryService = {
  ...base,
  async syncMember(memberId, overrides = {}) {
    const member = await requireRecord('members', 'id', memberId, 'Member not found.');
    const existing = assertResult(await supabase.from('bir_registry').select('id').eq('member_id', memberId).maybeSingle());
    const payload = fromMember(member, overrides);
    if (existing) return assertResult(await supabase.from('bir_registry').update(payload).eq('id', existing.id).select().single());
    return assertResult(await supabase.from('bir_registry').insert(payload).select().single());
  },
  async syncAll(overrides = {}) {
    const members = assertResult(await supabase.from('members').select('*')) || [];
    return Promise.all(members.map((member) => this.syncMember(member.id, overrides)));
  },
};
