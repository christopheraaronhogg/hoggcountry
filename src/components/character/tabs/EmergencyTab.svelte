<script lang="ts">
  import { loadCharacter, character, updateCharacter } from '../../../stores/character.svelte';

  loadCharacter();

  type Contact = (typeof character.emergency.contacts)[number];
  const emergency = $derived(character.emergency);

  function updateContact(id: number, patch: Partial<Contact>) {
    const next = (emergency.contacts || []).map((c) => (c.id === id ? { ...c, ...patch } : c));
    updateCharacter({ emergency: { contacts: next } } as any);
  }

  function addContact() {
    const id = Date.now();
    const next = [...(emergency.contacts || []), { id, name: '', relationship: '', phone: '' }];
    updateCharacter({ emergency: { contacts: next } } as any);
  }

  function removeContact(id: number) {
    const next = (emergency.contacts || []).filter((c) => c.id !== id);
    updateCharacter({ emergency: { contacts: next.length ? next : [{ id: 1, name: '', relationship: '', phone: '' }] } } as any);
  }

  function setPersonalField(key: keyof typeof character.emergency.personal, value: string) {
    updateCharacter({ emergency: { personal: { [key]: value } } } as any);
  }
</script>

<div class="grid">
  <div class="card">
    <h2 class="h">Contacts</h2>
    <p class="p">Keep this current. The Emergency tool can format an SOS card.</p>

    <div class="actions" style="margin: 0 0 0.75rem;">
      <button class="action" type="button" onclick={addContact}>Add contact</button>
      <a class="action" href="/tools/emergency/">Open Emergency Tool</a>
    </div>

    <div class="contact-list" aria-label="Emergency contacts">
      {#each emergency.contacts as c (c.id)}
        <div class="contact">
          <label class="field">
            <span class="k">Name</span>
            <input class="in" value={c.name} onchange={(e) => updateContact(c.id, { name: (e.currentTarget as HTMLInputElement).value })} />
          </label>
          <label class="field">
            <span class="k">Relationship</span>
            <input class="in" value={c.relationship} onchange={(e) => updateContact(c.id, { relationship: (e.currentTarget as HTMLInputElement).value })} />
          </label>
          <label class="field">
            <span class="k">Phone</span>
            <input class="in" value={c.phone} onchange={(e) => updateContact(c.id, { phone: (e.currentTarget as HTMLInputElement).value })} />
          </label>
          <div class="actions" style="justify-content: flex-end; align-items: end;">
            <button class="action" type="button" onclick={() => removeContact(c.id)}>Remove</button>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <div class="card">
    <h2 class="h">Medical</h2>
    <p class="p">Enough to help a stranger keep you alive.</p>

    <div class="form" style="grid-template-columns: repeat(2, minmax(0, 1fr));">
      <label class="field">
        <span class="k">Blood type</span>
        <input class="in" value={emergency.personal.bloodType} onchange={(e) => setPersonalField('bloodType', (e.currentTarget as HTMLInputElement).value)} />
      </label>
      <label class="field">
        <span class="k">Doctor phone</span>
        <input class="in" value={emergency.personal.doctorPhone} onchange={(e) => setPersonalField('doctorPhone', (e.currentTarget as HTMLInputElement).value)} />
      </label>
      <label class="field" style="grid-column: 1 / -1;">
        <span class="k">Allergies</span>
        <textarea class="ta" rows="2" onchange={(e) => setPersonalField('allergies', (e.currentTarget as HTMLTextAreaElement).value)}>{emergency.personal.allergies}</textarea>
      </label>
      <label class="field" style="grid-column: 1 / -1;">
        <span class="k">Conditions</span>
        <textarea class="ta" rows="2" onchange={(e) => setPersonalField('conditions', (e.currentTarget as HTMLTextAreaElement).value)}>{emergency.personal.conditions}</textarea>
      </label>
      <label class="field" style="grid-column: 1 / -1;">
        <span class="k">Medications</span>
        <textarea class="ta" rows="2" onchange={(e) => setPersonalField('medications', (e.currentTarget as HTMLTextAreaElement).value)}>{emergency.personal.medications}</textarea>
      </label>
      <label class="field" style="grid-column: 1 / -1;">
        <span class="k">Insurance</span>
        <textarea class="ta" rows="2" onchange={(e) => setPersonalField('insurance', (e.currentTarget as HTMLTextAreaElement).value)}>{emergency.personal.insurance}</textarea>
      </label>
    </div>
  </div>
</div>

<style>
  .contact-list {
    display: grid;
    gap: 0.75rem;
  }

  .contact {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 140px;
    gap: 0.75rem;
    padding: 0.85rem;
    border-radius: 14px;
    border: 1px solid rgba(0, 0, 0, 0.10);
    background: rgba(255, 255, 255, 0.62);
  }

  @media (max-width: 980px) {
    .contact {
      grid-template-columns: 1fr;
    }
  }
</style>
