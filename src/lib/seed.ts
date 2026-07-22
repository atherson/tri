import { supabase, TABLES } from '@/lib/supabase'

const IDS = {
  venues: {
    kicc: '11111111-1111-1111-1111-111111111111',
    kasarani: '22222222-2222-2222-2222-222222222222',
    carnivore: '33333333-3333-3333-3333-333333333333',
  },
  suppliers: {
    proAudio: '44444444-4444-4444-4444-444444444444',
    stageLight: '55555555-5555-5555-5555-555555555555',
    tentMasters: '66666666-6666-6666-6666-666666666666',
  },
  categories: {
    sound: '77777777-7777-7777-7777-777777777777',
    lighting: '88888888-8888-8888-8888-888888888888',
    tent: '99999999-9999-9999-9999-999999999999',
    staging: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    generator: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  },
  events: {
    nairobi: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    tech: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    wedding: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  },
  contracts: {
    sound: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
    lighting: '11111111-2222-3333-4444-555555555555',
    tent: '66666666-7777-8888-9999-aaaaaaaaaaaa',
  },
  assets: {
    speaker1: 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1',
    speaker2: 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2',
    mixer: 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3',
    mic1: 'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4',
    mic2: 'e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5',
    light1: 'f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6',
    light2: 'a7a7a7a7-a7a7-a7a7-a7a7-a7a7a7a7a7a7',
    light3: 'b8b8b8b8-b8b8-b8b8-b8b8-b8b8b8b8b8b8',
    ledScreen: 'c9c9c9c9-c9c9-c9c9-c9c9-c9c9c9c9c9c9',
    tent1: 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
    stage1: 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1',
    gen1: 'f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f2',
  },
}

const settingsId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

export async function seedDatabase(): Promise<{ inserted: number; errors: string[] }> {
  const errors: string[] = []
  let inserted = 0

  const clearOrder = [
    TABLES.payments, TABLES.invoices, TABLES.incidents, TABLES.approvals,
    TABLES.alerts, TABLES.movements, TABLES.assignments, TABLES.rentalItems,
    TABLES.contracts, TABLES.requirements, TABLES.events,
    TABLES.assets, TABLES.categories, TABLES.suppliers, TABLES.venues,
    TABLES.auditLogs, TABLES.settings,
  ]
  for (const t of clearOrder) {
    const { error } = await supabase.from(t).delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (error) errors.push(`clear ${t}: ${error.message}`)
  }

  const venues = [
    { id: IDS.venues.kicc, name: 'KICC Convention Centre', address: 'Harambee Ave, Nairobi', region: 'Nairobi', latitude: -1.2864, longitude: 36.8172, contact_person: 'Grace Wanjiru', phone: '+254700111222', email: 'events@kicc.co.ke', capacity: 5000, delivery_notes: 'Loading dock on rear entrance. Use Milimani Rd gate.', setup_restrictions: 'No drilling on marble floors. All rigging via existing trusses.', power_availability: '3-phase 415V, 200A per phase' },
    { id: IDS.venues.kasarani, name: 'Kasarani Sports Centre', address: 'Thika Rd, Nairobi', region: 'Nairobi', latitude: -1.2296, longitude: 36.9032, contact_person: 'John Mwangi', phone: '+254700333444', email: 'ops@kasarani.go.ke', capacity: 60000, delivery_notes: 'Vehicles under 5 tonnes use Gate B. Heavy trucks via Gate A with 24h notice.', setup_restrictions: 'Protect turf with boards. No vehicles on track.', power_availability: '3-phase 415V, 400A' },
    { id: IDS.venues.carnivore, name: 'The Carnivore Grounds', address: 'Langata Rd, Nairobi', region: 'Nairobi', latitude: -1.3621, longitude: 36.7345, contact_person: 'Aisha Mohammed', phone: '+254700555666', email: 'bookings@carnivore.co.ke', capacity: 3000, delivery_notes: 'Main gate on Langata Rd. Tight turn for trailers — send small trucks.', setup_restrictions: 'Noise curfew 23:00. Indoor areas close at midnight.', power_availability: '3-phase 415V, 150A' },
  ]
  const { error: ve } = await supabase.from(TABLES.venues).insert(venues)
  if (ve) errors.push(`venues: ${ve.message}`); else inserted += venues.length

  const suppliers = [
    { id: IDS.suppliers.proAudio, name: 'ProAudio Kenya Ltd', code: 'SUP-001', contact_person: 'Peter Kamau', phone: '+254711100100', email: 'peter@proaudio.co.ke', address: 'Industrial Area, Nairobi', tax_number: 'P051234567A', payment_terms: 'Net 30', category: 'sound', rating: 4.5, status: 'Active', notes: 'Reliable sound supplier. Offers 10% discount on weekly rentals.' },
    { id: IDS.suppliers.stageLight, name: 'StageLight Productions', code: 'SUP-002', contact_person: 'Sarah Otieno', phone: '+254711200200', email: 'sarah@stagelight.co.ke', address: 'Westlands, Nairobi', tax_number: 'P052345678B', payment_terms: 'Net 15', category: 'lighting', rating: 4.2, status: 'Active', notes: 'Specializes in LED and intelligent lighting.' },
    { id: IDS.suppliers.tentMasters, name: 'TentMasters EA', code: 'SUP-003', contact_person: 'David Mutua', phone: '+254711300300', email: 'david@tentmasters.co.ke', address: 'Mombasa Rd, Nairobi', tax_number: 'P053456789C', payment_terms: '50% deposit, balance on completion', category: 'tents', rating: 4.7, status: 'Active', notes: 'Large format tents and staging. Owns transport fleet.' },
  ]
  const { error: se } = await supabase.from(TABLES.suppliers).insert(suppliers)
  if (se) errors.push(`suppliers: ${se.message}`); else inserted += suppliers.length

  const categories = [
    { id: IDS.categories.sound, name: 'Sound Systems', description: 'PA systems, speakers, subwoofers, amplifiers', unit_of_measurement: 'unit', default_daily_rate: 15000, default_replacement_cost: 250000, serialized: true },
    { id: IDS.categories.lighting, name: 'Lighting Equipment', description: 'LED panels, moving heads, par cans, controllers', unit_of_measurement: 'unit', default_daily_rate: 8000, default_replacement_cost: 120000, serialized: true },
    { id: IDS.categories.tent, name: 'Tents & Structures', description: 'Marquee tents, pagoda tents', unit_of_measurement: 'unit', default_daily_rate: 25000, default_replacement_cost: 500000, serialized: true },
    { id: IDS.categories.staging, name: 'Staging Materials', description: 'Stage decks, risers, ramps, stairs', unit_of_measurement: 'sqm', default_daily_rate: 500, default_replacement_cost: 8000, serialized: false },
    { id: IDS.categories.generator, name: 'Power & Generators', description: 'Generators, UPS, distribution boxes', unit_of_measurement: 'unit', default_daily_rate: 18000, default_replacement_cost: 800000, serialized: true },
  ]
  const { error: ce } = await supabase.from(TABLES.categories).insert(categories)
  if (ce) errors.push(`categories: ${ce.message}`); else inserted += categories.length

  const assets = [
    { id: IDS.assets.speaker1, asset_code: 'AUD-SPK-001', name: 'Line Array Speaker L-Acoustics K2', description: 'Top-tier line array element', category_id: IDS.categories.sound, supplier_id: IDS.suppliers.proAudio, brand: 'L-Acoustics', model: 'K2', serial_number: 'LA-K2-2023-001', status: 'Available', condition: 'Excellent', location: 'ProAudio Warehouse', daily_rate: 15000, replacement_cost: 250000, last_maintenance_date: '2024-06-15', next_maintenance_date: '2024-12-15', notes: null },
    { id: IDS.assets.speaker2, asset_code: 'AUD-SPK-002', name: 'Line Array Speaker L-Acoustics K2', description: 'Top-tier line array element', category_id: IDS.categories.sound, supplier_id: IDS.suppliers.proAudio, brand: 'L-Acoustics', model: 'K2', serial_number: 'LA-K2-2023-002', status: 'Available', condition: 'Excellent', location: 'ProAudio Warehouse', daily_rate: 15000, replacement_cost: 250000, last_maintenance_date: '2024-06-15', next_maintenance_date: '2024-12-15', notes: null },
    { id: IDS.assets.mixer, asset_code: 'AUD-MIX-001', name: 'Digital Mixing Console Yamaha CL5', description: '96-channel digital mixer', category_id: IDS.categories.sound, supplier_id: IDS.suppliers.proAudio, brand: 'Yamaha', model: 'CL5', serial_number: 'YM-CL5-2022-014', status: 'Available', condition: 'Good', location: 'ProAudio Warehouse', daily_rate: 20000, replacement_cost: 350000, last_maintenance_date: '2024-03-20', next_maintenance_date: '2024-09-20', notes: null },
    { id: IDS.assets.mic1, asset_code: 'AUD-MIC-001', name: 'Shure SM58 Dynamic Microphone', description: 'Vocal microphone', category_id: IDS.categories.sound, supplier_id: IDS.suppliers.proAudio, brand: 'Shure', model: 'SM58', serial_number: 'SH-SM58-0042', status: 'Available', condition: 'Good', location: 'ProAudio Warehouse', daily_rate: 500, replacement_cost: 5000, last_maintenance_date: null, next_maintenance_date: null, notes: null },
    { id: IDS.assets.mic2, asset_code: 'AUD-MIC-002', name: 'Shure SM58 Dynamic Microphone', description: 'Vocal microphone', category_id: IDS.categories.sound, supplier_id: IDS.suppliers.proAudio, brand: 'Shure', model: 'SM58', serial_number: 'SH-SM58-0043', status: 'Available', condition: 'Good', location: 'ProAudio Warehouse', daily_rate: 500, replacement_cost: 5000, last_maintenance_date: null, next_maintenance_date: null, notes: null },
    { id: IDS.assets.light1, asset_code: 'LGT-MH-001', name: 'Moving Head Wash 560W', description: 'LED moving head with zoom', category_id: IDS.categories.lighting, supplier_id: IDS.suppliers.stageLight, brand: 'Robe', model: 'Pointe', serial_number: 'RB-PT-2023-101', status: 'Available', condition: 'Excellent', location: 'StageLight Workshop', daily_rate: 8000, replacement_cost: 120000, last_maintenance_date: '2024-05-10', next_maintenance_date: '2024-11-10', notes: null },
    { id: IDS.assets.light2, asset_code: 'LGT-MH-002', name: 'Moving Head Wash 560W', description: 'LED moving head with zoom', category_id: IDS.categories.lighting, supplier_id: IDS.suppliers.stageLight, brand: 'Robe', model: 'Pointe', serial_number: 'RB-PT-2023-102', status: 'Available', condition: 'Good', location: 'StageLight Workshop', daily_rate: 8000, replacement_cost: 120000, last_maintenance_date: '2024-05-10', next_maintenance_date: '2024-11-10', notes: null },
    { id: IDS.assets.light3, asset_code: 'LGT-LED-001', name: 'LED Par 64 RGBW', description: 'LED wash light', category_id: IDS.categories.lighting, supplier_id: IDS.suppliers.stageLight, brand: 'Chauvet', model: 'COLORado Batten', serial_number: 'CV-CB-2022-205', status: 'Available', condition: 'Good', location: 'StageLight Workshop', daily_rate: 3000, replacement_cost: 25000, last_maintenance_date: null, next_maintenance_date: null, notes: null },
    { id: IDS.assets.ledScreen, asset_code: 'LGT-LED-SCR-001', name: 'LED Video Wall Panel P3.9', description: 'Indoor/outdoor LED panel', category_id: IDS.categories.lighting, supplier_id: IDS.suppliers.stageLight, brand: 'Absen', model: 'Polaris P3.9', serial_number: 'AB-PL-2023-301', status: 'Available', condition: 'Excellent', location: 'StageLight Workshop', daily_rate: 12000, replacement_cost: 200000, last_maintenance_date: '2024-04-01', next_maintenance_date: '2024-10-01', notes: null },
    { id: IDS.assets.tent1, asset_code: 'TNT-001', name: 'Marquee Tent 20x40m', description: 'Large frame tent with sidewalls', category_id: IDS.categories.tent, supplier_id: IDS.suppliers.tentMasters, brand: 'Roder', model: 'RTS 20x40', serial_number: 'RD-RTS-2021-008', status: 'Available', condition: 'Good', location: 'TentMasters Yard', daily_rate: 25000, replacement_cost: 500000, last_maintenance_date: '2024-01-15', next_maintenance_date: '2025-01-15', notes: null },
    { id: IDS.assets.stage1, asset_code: 'STG-001', name: 'Stage Deck 1x2m', description: 'Modular stage deck panel', category_id: IDS.categories.staging, supplier_id: IDS.suppliers.tentMasters, brand: 'Prolyte', model: 'MPT', serial_number: null, status: 'Available', condition: 'Good', location: 'TentMasters Yard', daily_rate: 500, replacement_cost: 8000, last_maintenance_date: null, next_maintenance_date: null, notes: 'Quantity-based item' },
    { id: IDS.assets.gen1, asset_code: 'PWR-GEN-001', name: 'Diesel Generator 100kVA', description: 'Silent generator with ATS', category_id: IDS.categories.generator, supplier_id: IDS.suppliers.tentMasters, brand: 'FG Wilson', model: 'P100', serial_number: 'FW-P100-2022-012', status: 'Available', condition: 'Excellent', location: 'TentMasters Yard', daily_rate: 18000, replacement_cost: 800000, last_maintenance_date: '2024-06-01', next_maintenance_date: '2024-12-01', notes: null },
  ]
  const { error: ae } = await supabase.from(TABLES.assets).insert(assets)
  if (ae) errors.push(`assets: ${ae.message}`); else inserted += assets.length

  const events = [
    {
      id: IDS.events.nairobi, name: 'Nairobi Summer Music Festival', event_code: 'EVT-2025-001',
      description: 'Three-day outdoor music festival featuring local and international artists.',
      client_name: 'Live Nation Africa', event_type: 'Music Festival', venue_id: IDS.venues.kasarani,
      setup_start: '2025-08-10T08:00:00+03:00', event_start: '2025-08-11T16:00:00+03:00',
      event_end: '2025-08-12T23:00:00+03:00', dismantle_end: '2025-08-13T12:00:00+03:00',
      expected_attendance: 15000, budget: 8500000, status: 'Shortened', priority: 'High',
      notes: 'Final day cancelled due to weather. Event shortened from 3 days to 2 days.',
    },
    {
      id: IDS.events.tech, name: 'Nairobi Tech Summit 2025', event_code: 'EVT-2025-002',
      description: 'Annual technology conference with exhibitor booths and keynote sessions.',
      client_name: 'Tech Africa Ltd', event_type: 'Conference', venue_id: IDS.venues.kicc,
      setup_start: '2025-09-15T06:00:00+03:00', event_start: '2025-09-16T09:00:00+03:00',
      event_end: '2025-09-17T17:00:00+03:00', dismantle_end: '2025-09-18T12:00:00+03:00',
      expected_attendance: 2000, budget: 3200000, status: 'Planned', priority: 'Medium', notes: null,
    },
    {
      id: IDS.events.wedding, name: 'Garden Wedding Reception', event_code: 'EVT-2025-003',
      description: 'Outdoor wedding reception with live band and catering.',
      client_name: 'Private Client', event_type: 'Wedding', venue_id: IDS.venues.carnivore,
      setup_start: '2025-10-10T14:00:00+03:00', event_start: '2025-10-10T17:00:00+03:00',
      event_end: '2025-10-10T23:00:00+03:00', dismantle_end: '2025-10-11T06:00:00+03:00',
      expected_attendance: 300, budget: 800000, status: 'Draft', priority: 'Low', notes: null,
    },
  ]
  const { error: ee } = await supabase.from(TABLES.events).insert(events)
  if (ee) errors.push(`events: ${ee.message}`); else inserted += events.length

  const scheduleChanges = [
    { id: crypto.randomUUID(), event_id: IDS.events.nairobi, field: 'event_end', previous_value: '2025-08-13T23:00:00+03:00', new_value: '2025-08-12T23:00:00+03:00', reason: 'Final day cancelled due to adverse weather forecast', created_at: '2025-08-12T08:00:00+03:00' },
    { id: crypto.randomUUID(), event_id: IDS.events.nairobi, field: 'dismantle_end', previous_value: '2025-08-14T12:00:00+03:00', new_value: '2025-08-13T12:00:00+03:00', reason: 'Dismantling moved up to match shortened event', created_at: '2025-08-12T08:05:00+03:00' },
  ]
  const { error: sce } = await supabase.from('event_schedule_changes').insert(scheduleChanges)
  if (sce) errors.push(`schedule_changes: ${sce.message}`); else inserted += scheduleChanges.length

  const contracts = [
    {
      id: IDS.contracts.sound, contract_number: 'RC-2025-001', supplier_id: IDS.suppliers.proAudio, event_id: IDS.events.nairobi,
      title: 'Sound System Rental — Nairobi Summer Music Festival',
      contract_start: '2025-08-09T08:00:00+03:00', contract_end: '2025-08-15T18:00:00+03:00',
      delivery_date: '2025-08-09T08:00:00+03:00', collection_date: '2025-08-15T10:00:00+03:00',
      billing_model: 'Daily', currency: 'KES', subtotal: 210000, tax: 33600, discount: 0, deposit: 50000,
      estimated_total: 243600, actual_final_cost: null, payment_status: 'Partially paid', contract_status: 'Active',
      cancellation_terms: '48h notice required. 30% charge on cancelled days.', extension_terms: 'Daily rate applies. 24h notice.',
      late_return_charges: '1.5x daily rate per day late', grace_period_hours: 24, minimum_duration_hours: 24,
      notes: 'Includes setup and sound engineering crew',
    },
    {
      id: IDS.contracts.lighting, contract_number: 'RC-2025-002', supplier_id: IDS.suppliers.stageLight, event_id: IDS.events.nairobi,
      title: 'Lighting & LED Screen Rental — Nairobi Summer Music Festival',
      contract_start: '2025-08-09T08:00:00+03:00', contract_end: '2025-08-15T18:00:00+03:00',
      delivery_date: '2025-08-09T08:00:00+03:00', collection_date: '2025-08-15T10:00:00+03:00',
      billing_model: 'Daily', currency: 'KES', subtotal: 180000, tax: 28800, discount: 10000, deposit: 30000,
      estimated_total: 198800, actual_final_cost: null, payment_status: 'Unpaid', contract_status: 'Active',
      cancellation_terms: '72h notice. 20% charge on cancelled days.', extension_terms: 'Daily rate. 48h notice.',
      late_return_charges: '1.5x daily rate per day late', grace_period_hours: 24, minimum_duration_hours: 48,
      notes: 'Includes lighting technician',
    },
    {
      id: IDS.contracts.tent, contract_number: 'RC-2025-003', supplier_id: IDS.suppliers.tentMasters, event_id: IDS.events.nairobi,
      title: 'Tent & Staging Rental — Nairobi Summer Music Festival',
      contract_start: '2025-08-10T06:00:00+03:00', contract_end: '2025-08-14T18:00:00+03:00',
      delivery_date: '2025-08-10T06:00:00+03:00', collection_date: '2025-08-14T14:00:00+03:00',
      billing_model: 'Daily', currency: 'KES', subtotal: 150000, tax: 24000, discount: 0, deposit: 40000,
      estimated_total: 174000, actual_final_cost: null, payment_status: 'Unpaid', contract_status: 'Active',
      cancellation_terms: 'No cancellation within 72h of delivery. Full charge applies.', extension_terms: 'Daily rate. 24h notice.',
      late_return_charges: '1x daily rate per day late', grace_period_hours: 12, minimum_duration_hours: 48,
      notes: 'Includes installation crew and transport',
    },
  ]
  const { error: rce } = await supabase.from(TABLES.contracts).insert(contracts)
  if (rce) errors.push(`contracts: ${rce.message}`); else inserted += contracts.length

  const rentalItems = [
    { id: crypto.randomUUID(), contract_id: IDS.contracts.sound, category_id: IDS.categories.sound, asset_id: IDS.assets.speaker1, description: 'L-Acoustics K2 Line Array (pair)', quantity: 2, unit_rate: 15000, rental_start: '2025-08-09T08:00:00+03:00', rental_end: '2025-08-15T18:00:00+03:00', billable_units: 6, estimated_line_cost: 180000, actual_line_cost: null, utilization_status: null, notes: null },
    { id: crypto.randomUUID(), contract_id: IDS.contracts.sound, category_id: IDS.categories.sound, asset_id: IDS.assets.mixer, description: 'Yamaha CL5 Digital Mixer', quantity: 1, unit_rate: 20000, rental_start: '2025-08-09T08:00:00+03:00', rental_end: '2025-08-15T18:00:00+03:00', billable_units: 6, estimated_line_cost: 120000, actual_line_cost: null, utilization_status: null, notes: null },
    { id: crypto.randomUUID(), contract_id: IDS.contracts.lighting, category_id: IDS.categories.lighting, asset_id: IDS.assets.light1, description: 'Robe Pointe Moving Heads', quantity: 2, unit_rate: 8000, rental_start: '2025-08-09T08:00:00+03:00', rental_end: '2025-08-15T18:00:00+03:00', billable_units: 6, estimated_line_cost: 96000, actual_line_cost: null, utilization_status: null, notes: null },
    { id: crypto.randomUUID(), contract_id: IDS.contracts.lighting, category_id: IDS.categories.lighting, asset_id: IDS.assets.ledScreen, description: 'Absen P3.9 LED Video Wall', quantity: 1, unit_rate: 12000, rental_start: '2025-08-09T08:00:00+03:00', rental_end: '2025-08-15T18:00:00+03:00', billable_units: 6, estimated_line_cost: 72000, actual_line_cost: null, utilization_status: null, notes: null },
    { id: crypto.randomUUID(), contract_id: IDS.contracts.tent, category_id: IDS.categories.tent, asset_id: IDS.assets.tent1, description: 'Roder Marquee Tent 20x40m', quantity: 1, unit_rate: 25000, rental_start: '2025-08-10T06:00:00+03:00', rental_end: '2025-08-14T18:00:00+03:00', billable_units: 4, estimated_line_cost: 100000, actual_line_cost: null, utilization_status: null, notes: null },
    { id: crypto.randomUUID(), contract_id: IDS.contracts.tent, category_id: IDS.categories.staging, asset_id: IDS.assets.stage1, description: 'Stage Deck Panels (100 sqm)', quantity: 100, unit_rate: 500, rental_start: '2025-08-10T06:00:00+03:00', rental_end: '2025-08-14T18:00:00+03:00', billable_units: 4, estimated_line_cost: 50000, actual_line_cost: null, utilization_status: null, notes: null },
  ]
  const { error: rie } = await supabase.from(TABLES.rentalItems).insert(rentalItems)
  if (rie) errors.push(`rental_items: ${rie.message}`); else inserted += rentalItems.length

  const assignments = [
    { id: crypto.randomUUID(), event_id: IDS.events.nairobi, contract_id: IDS.contracts.sound, rental_item_id: rentalItems[0].id, asset_id: IDS.assets.speaker1, quantity: 2, required_start: '2025-08-10T08:00:00+03:00', required_end: '2025-08-13T12:00:00+03:00', assigned_to: 'James K. (Field Staff)', status: 'In use', current_location: 'Kasarani Sports Centre', check_in_status: 'Checked in', check_out_status: null },
    { id: crypto.randomUUID(), event_id: IDS.events.nairobi, contract_id: IDS.contracts.sound, rental_item_id: rentalItems[1].id, asset_id: IDS.assets.mixer, quantity: 1, required_start: '2025-08-10T08:00:00+03:00', required_end: '2025-08-13T12:00:00+03:00', assigned_to: 'James K. (Field Staff)', status: 'In use', current_location: 'Kasarani Sports Centre', check_in_status: 'Checked in', check_out_status: null },
    { id: crypto.randomUUID(), event_id: IDS.events.nairobi, contract_id: IDS.contracts.lighting, rental_item_id: rentalItems[2].id, asset_id: IDS.assets.light1, quantity: 2, required_start: '2025-08-10T08:00:00+03:00', required_end: '2025-08-13T12:00:00+03:00', assigned_to: 'Mary N. (Field Staff)', status: 'In use', current_location: 'Kasarani Sports Centre', check_in_status: 'Checked in', check_out_status: null },
    { id: crypto.randomUUID(), event_id: IDS.events.nairobi, contract_id: IDS.contracts.lighting, rental_item_id: rentalItems[3].id, asset_id: IDS.assets.ledScreen, quantity: 1, required_start: '2025-08-10T08:00:00+03:00', required_end: '2025-08-13T12:00:00+03:00', assigned_to: 'Mary N. (Field Staff)', status: 'In use', current_location: 'Kasarani Sports Centre', check_in_status: 'Checked in', check_out_status: null },
    { id: crypto.randomUUID(), event_id: IDS.events.nairobi, contract_id: IDS.contracts.tent, rental_item_id: rentalItems[4].id, asset_id: IDS.assets.tent1, quantity: 1, required_start: '2025-08-10T06:00:00+03:00', required_end: '2025-08-13T12:00:00+03:00', assigned_to: 'Peter O. (Field Staff)', status: 'In use', current_location: 'Kasarani Sports Centre', check_in_status: 'Checked in', check_out_status: null },
  ]
  const { error: ase } = await supabase.from(TABLES.assignments).insert(assignments)
  if (ase) errors.push(`assignments: ${ase.message}`); else inserted += assignments.length

  const now = new Date()
  const movements = [
    { id: crypto.randomUUID(), asset_id: IDS.assets.speaker1, event_id: IDS.events.nairobi, contract_id: IDS.contracts.sound, movement_type: 'Dispatched', previous_status: 'Available', new_status: 'In transit', previous_location: 'ProAudio Warehouse', new_location: 'In transit to Kasarani', user_name: 'Operations Manager', notes: 'Dispatched with delivery truck', latitude: -1.2864, longitude: 36.8172, created_at: '2025-08-09T07:00:00+03:00' },
    { id: crypto.randomUUID(), asset_id: IDS.assets.speaker1, event_id: IDS.events.nairobi, contract_id: IDS.contracts.sound, movement_type: 'Delivered', previous_status: 'In transit', new_status: 'Delivered', previous_location: 'In transit', new_location: 'Kasarani Sports Centre', user_name: 'James K. (Field Staff)', notes: 'Delivered at loading dock', latitude: -1.2296, longitude: 36.9032, created_at: '2025-08-09T09:30:00+03:00' },
    { id: crypto.randomUUID(), asset_id: IDS.assets.speaker1, event_id: IDS.events.nairobi, contract_id: IDS.contracts.sound, movement_type: 'Checked in', previous_status: 'Delivered', new_status: 'Checked in', previous_location: 'Kasarani Loading Dock', new_location: 'Kasarani Main Stage', user_name: 'James K. (Field Staff)', notes: 'Checked in at stage', latitude: -1.2296, longitude: 36.9032, created_at: '2025-08-10T08:30:00+03:00' },
    { id: crypto.randomUUID(), asset_id: IDS.assets.speaker1, event_id: IDS.events.nairobi, contract_id: IDS.contracts.sound, movement_type: 'Installed', previous_status: 'Checked in', new_status: 'Installed', previous_location: 'Kasarani Main Stage', new_location: 'Kasarani Main Stage — L-Rig', user_name: 'James K. (Field Staff)', notes: 'Rigged on left array', latitude: -1.2296, longitude: 36.9032, created_at: '2025-08-10T14:00:00+03:00' },
    { id: crypto.randomUUID(), asset_id: IDS.assets.speaker1, event_id: IDS.events.nairobi, contract_id: IDS.contracts.sound, movement_type: 'Marked in use', previous_status: 'Installed', new_status: 'In use', previous_location: 'Kasarani Main Stage — L-Rig', new_location: 'Kasarani Main Stage — L-Rig', user_name: 'James K. (Field Staff)', notes: 'Sound check complete, system live', latitude: -1.2296, longitude: 36.9032, created_at: '2025-08-11T15:00:00+03:00' },
    { id: crypto.randomUUID(), asset_id: IDS.assets.speaker1, event_id: IDS.events.nairobi, contract_id: IDS.contracts.sound, movement_type: 'Checked out', previous_status: 'In use', new_status: 'Collected', previous_location: 'Kasarani Main Stage — L-Rig', new_location: 'Kasarani Loading Dock', user_name: 'James K. (Field Staff)', notes: 'Checked out after final show', latitude: -1.2296, longitude: 36.9032, created_at: '2025-08-13T08:00:00+03:00' },
    { id: crypto.randomUUID(), asset_id: IDS.assets.speaker1, event_id: IDS.events.nairobi, contract_id: IDS.contracts.sound, movement_type: 'Returned', previous_status: 'Collected', new_status: 'Returned', previous_location: 'Kasarani Loading Dock', new_location: 'ProAudio Warehouse', user_name: 'Peter Kamau (Supplier)', notes: 'Returned to supplier warehouse', latitude: -1.2864, longitude: 36.8172, created_at: '2025-08-13T16:00:00+03:00' },
    { id: crypto.randomUUID(), asset_id: IDS.assets.mixer, event_id: IDS.events.nairobi, contract_id: IDS.contracts.sound, movement_type: 'Dispatched', previous_status: 'Available', new_status: 'In transit', previous_location: 'ProAudio Warehouse', new_location: 'In transit', user_name: 'Operations Manager', notes: null, latitude: null, longitude: null, created_at: '2025-08-09T07:00:00+03:00' },
    { id: crypto.randomUUID(), asset_id: IDS.assets.mixer, event_id: IDS.events.nairobi, contract_id: IDS.contracts.sound, movement_type: 'Delivered', previous_status: 'In transit', new_status: 'Delivered', previous_location: 'In transit', new_location: 'Kasarani Sports Centre', user_name: 'James K. (Field Staff)', notes: null, latitude: null, longitude: null, created_at: '2025-08-09T09:30:00+03:00' },
    { id: crypto.randomUUID(), asset_id: IDS.assets.mixer, event_id: IDS.events.nairobi, contract_id: IDS.contracts.sound, movement_type: 'Installed', previous_status: 'Delivered', new_status: 'Installed', previous_location: 'Kasarani Loading Dock', new_location: 'FOH Position', user_name: 'James K. (Field Staff)', notes: null, latitude: null, longitude: null, created_at: '2025-08-10T10:00:00+03:00' },
    { id: crypto.randomUUID(), asset_id: IDS.assets.mixer, event_id: IDS.events.nairobi, contract_id: IDS.contracts.sound, movement_type: 'Marked in use', previous_status: 'Installed', new_status: 'In use', previous_location: 'FOH Position', new_location: 'FOH Position', user_name: 'James K. (Field Staff)', notes: null, latitude: null, longitude: null, created_at: '2025-08-11T15:00:00+03:00' },
    { id: crypto.randomUUID(), asset_id: IDS.assets.mixer, event_id: IDS.events.nairobi, contract_id: IDS.contracts.sound, movement_type: 'Checked out', previous_status: 'In use', new_status: 'Collected', previous_location: 'FOH Position', new_location: 'Kasarani Loading Dock', user_name: 'James K. (Field Staff)', notes: null, latitude: null, longitude: null, created_at: '2025-08-13T08:00:00+03:00' },
    { id: crypto.randomUUID(), asset_id: IDS.assets.light1, event_id: IDS.events.nairobi, contract_id: IDS.contracts.lighting, movement_type: 'Delivered', previous_status: 'Available', new_status: 'Delivered', previous_location: 'StageLight Workshop', new_location: 'Kasarani Sports Centre', user_name: 'Mary N. (Field Staff)', notes: null, latitude: null, longitude: null, created_at: '2025-08-09T10:00:00+03:00' },
    { id: crypto.randomUUID(), asset_id: IDS.assets.light1, event_id: IDS.events.nairobi, contract_id: IDS.contracts.lighting, movement_type: 'Installed', previous_status: 'Delivered', new_status: 'Installed', previous_location: 'Kasarani Loading Dock', new_location: 'Stage Truss', user_name: 'Mary N. (Field Staff)', notes: null, latitude: null, longitude: null, created_at: '2025-08-10T12:00:00+03:00' },
    { id: crypto.randomUUID(), asset_id: IDS.assets.light1, event_id: IDS.events.nairobi, contract_id: IDS.contracts.lighting, movement_type: 'Marked in use', previous_status: 'Installed', new_status: 'In use', previous_location: 'Stage Truss', new_location: 'Stage Truss', user_name: 'Mary N. (Field Staff)', notes: null, latitude: null, longitude: null, created_at: '2025-08-11T16:00:00+03:00' },
    { id: crypto.randomUUID(), asset_id: IDS.assets.ledScreen, event_id: IDS.events.nairobi, contract_id: IDS.contracts.lighting, movement_type: 'Delivered', previous_status: 'Available', new_status: 'Delivered', previous_location: 'StageLight Workshop', new_location: 'Kasarani Sports Centre', user_name: 'Mary N. (Field Staff)', notes: null, latitude: null, longitude: null, created_at: '2025-08-09T10:00:00+03:00' },
    { id: crypto.randomUUID(), asset_id: IDS.assets.ledScreen, event_id: IDS.events.nairobi, contract_id: IDS.contracts.lighting, movement_type: 'Marked idle', previous_status: 'Delivered', new_status: 'Idle', previous_location: 'Kasarani Loading Dock', new_location: 'Kasarani Storage Area', user_name: 'Mary N. (Field Staff)', notes: 'Not needed until day 2', latitude: null, longitude: null, created_at: new Date(now.getTime() - 3 * 24 * 36e5).toISOString() },
    { id: crypto.randomUUID(), asset_id: IDS.assets.tent1, event_id: IDS.events.nairobi, contract_id: IDS.contracts.tent, movement_type: 'Delivered', previous_status: 'Available', new_status: 'Delivered', previous_location: 'TentMasters Yard', new_location: 'Kasarani Sports Centre', user_name: 'Peter O. (Field Staff)', notes: null, latitude: null, longitude: null, created_at: '2025-08-10T06:30:00+03:00' },
    { id: crypto.randomUUID(), asset_id: IDS.assets.tent1, event_id: IDS.events.nairobi, contract_id: IDS.contracts.tent, movement_type: 'Installed', previous_status: 'Delivered', new_status: 'Installed', previous_location: 'Kasarani Loading Dock', new_location: 'Main Arena', user_name: 'Peter O. (Field Staff)', notes: null, latitude: null, longitude: null, created_at: '2025-08-10T16:00:00+03:00' },
    { id: crypto.randomUUID(), asset_id: IDS.assets.tent1, event_id: IDS.events.nairobi, contract_id: IDS.contracts.tent, movement_type: 'Marked in use', previous_status: 'Installed', new_status: 'In use', previous_location: 'Main Arena', new_location: 'Main Arena', user_name: 'Peter O. (Field Staff)', notes: null, latitude: null, longitude: null, created_at: '2025-08-11T16:00:00+03:00' },
  ]
  const { error: me } = await supabase.from(TABLES.movements).insert(movements)
  if (me) errors.push(`movements: ${me.message}`); else inserted += movements.length

  const invoices = [
    { id: crypto.randomUUID(), invoice_number: 'INV-2025-001', supplier_id: IDS.suppliers.proAudio, contract_id: IDS.contracts.sound, event_id: IDS.events.nairobi, invoice_date: '2025-08-09', due_date: '2025-09-08', subtotal: 210000, tax: 33600, total: 243600, amount_paid: 100000, balance: 143600, approval_status: 'Approved', payment_status: 'Partially paid' },
    { id: crypto.randomUUID(), invoice_number: 'INV-2025-002', supplier_id: IDS.suppliers.stageLight, contract_id: IDS.contracts.lighting, event_id: IDS.events.nairobi, invoice_date: '2025-08-09', due_date: '2025-08-24', subtotal: 180000, tax: 28800, total: 198800, amount_paid: 0, balance: 198800, approval_status: 'Pending', payment_status: 'Unpaid' },
    { id: crypto.randomUUID(), invoice_number: 'INV-2025-003', supplier_id: IDS.suppliers.tentMasters, contract_id: IDS.contracts.tent, event_id: IDS.events.nairobi, invoice_date: '2025-08-10', due_date: '2025-08-25', subtotal: 150000, tax: 24000, total: 174000, amount_paid: 0, balance: 174000, approval_status: 'Pending', payment_status: 'Unpaid' },
  ]
  const { error: ie } = await supabase.from(TABLES.invoices).insert(invoices)
  if (ie) errors.push(`invoices: ${ie.message}`); else inserted += invoices.length

  const payments = [
    { id: crypto.randomUUID(), invoice_id: invoices[0].id, amount: 100000, method: 'Bank transfer', reference: 'TRX-2025-0042', payment_date: '2025-08-12', recorded_by: 'Finance Officer', notes: '50% advance payment' },
  ]
  const { error: pe } = await supabase.from(TABLES.payments).insert(payments)
  if (pe) errors.push(`payments: ${pe.message}`); else inserted += payments.length

  const incidents = [
    { id: crypto.randomUUID(), incident_number: 'INC-2025-001', event_id: IDS.events.nairobi, asset_id: IDS.assets.light2, supplier_id: IDS.suppliers.stageLight, category: 'Damaged', severity: 'Medium', description: 'One moving head unit dropped during rigging — housing cracked, lens damaged.', occurred_at: '2025-08-10T13:30:00+03:00', reported_by: 'Mary N. (Field Staff)', assigned_to: 'Operations Manager', status: 'Open', resolution_notes: null, estimated_cost_impact: 25000, final_cost_impact: null },
    { id: crypto.randomUUID(), incident_number: 'INC-2025-002', event_id: IDS.events.nairobi, asset_id: IDS.assets.mic1, supplier_id: IDS.suppliers.proAudio, category: 'Missing', severity: 'Low', description: 'One microphone not returned after sound check. Possibly misplaced.', occurred_at: '2025-08-11T18:00:00+03:00', reported_by: 'James K. (Field Staff)', assigned_to: null, status: 'Under investigation', resolution_notes: null, estimated_cost_impact: 5000, final_cost_impact: null },
  ]
  const { error: ice } = await supabase.from(TABLES.incidents).insert(incidents)
  if (ice) errors.push(`incidents: ${ice.message}`); else inserted += incidents.length

  const auditLogs = [
    { id: crypto.randomUUID(), user_name: 'Event Manager', action: 'event.created', entity_type: 'event', entity_id: IDS.events.nairobi, previous_values: null, new_values: { name: 'Nairobi Summer Music Festival' }, ip_address: null, user_agent: null },
    { id: crypto.randomUUID(), user_name: 'Event Manager', action: 'event.schedule_changed', entity_type: 'event', entity_id: IDS.events.nairobi, previous_values: { event_end: '2025-08-13T23:00:00+03:00', dismantle_end: '2025-08-14T12:00:00+03:00' }, new_values: { event_end: '2025-08-12T23:00:00+03:00', dismantle_end: '2025-08-13T12:00:00+03:00', reason: 'Weather cancellation' }, ip_address: null, user_agent: null },
    { id: crypto.randomUUID(), user_name: 'Operations Manager', action: 'contract.created', entity_type: 'rental_contract', entity_id: IDS.contracts.sound, previous_values: null, new_values: { contract_number: 'RC-2025-001' }, ip_address: null, user_agent: null },
    { id: crypto.randomUUID(), user_name: 'James K. (Field Staff)', action: 'equipment.checked_in', entity_type: 'equipment_asset', entity_id: IDS.assets.speaker1, previous_values: { status: 'Delivered' }, new_values: { status: 'Checked in' }, ip_address: null, user_agent: null },
    { id: crypto.randomUUID(), user_name: 'Finance Officer', action: 'payment.recorded', entity_type: 'invoice', entity_id: invoices[0].id, previous_values: { amount_paid: 0 }, new_values: { amount_paid: 100000 }, ip_address: null, user_agent: null },
  ]
  const { error: ale } = await supabase.from(TABLES.auditLogs).insert(auditLogs)
  if (ale) errors.push(`audit_logs: ${ale.message}`); else inserted += auditLogs.length

  const settings = {
    id: settingsId, setup_allowance_hours: 24, idle_threshold_hours: 48,
    grace_period_hours: 24, early_rental_threshold_hours: 12,
    late_rental_threshold_hours: 6, budget_warning_percent: 80, currency: 'KES',
  }
  const { error: ste } = await supabase.from(TABLES.settings).insert(settings)
  if (ste) errors.push(`settings: ${ste.message}`); else inserted += 1

  return { inserted, errors }
}
