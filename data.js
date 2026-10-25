/* Relay demo scenario. Day 1, 14:20, Pune district. All organisations and figures are fictional.
   Locations are in km on a 50 x 40 km grid (x east, y south) used by the maps and distance checks. */
(function (root) {
  'use strict';

  function node(o) {
    return Object.assign({
      type: 'single', vehicles: [], products: [], tradedWith: [], cantReach: [],
      checkin: null, lastActivity: null, pingedAt: null, confirmedGone: false,
      verification: 'neighbour', trust: 0.6, radiusKm: 40
    }, o);
  }

  function seed() {
    return {
      v: 3,
      now: 860, // minutes from Day 1 00:00, so 860 = Day 1, 14:20
      me: 'joshi',
      session: { stage: 'invite', phone: '', lang: 'en', checkinStep: 0, draft: {} },
      settings: { sunlight: false, offline: false },
      seq: 300,
      nodes: {
        joshi: node({ id: 'joshi', name: 'Joshi Fleet Services', type: 'pooled', role: 'transporter', area: 'Hadapsar Yard', code: 'Node #490', corridor: 'East Pune Corridor', x: 27, y: 26, lab: [18, -10],
          products: ['medicine', 'grain', 'packaged food'], perish: ['dry', 'chilled in cold boxes, under 1 hour'],
          vehicles: [{ kind: 'van', label: 'Van', count: 4, capKg: 1500, refrigerated: false, coldBoxes: true }],
          verification: 'anchor', trust: 0.82, pingedAt: 500, phone: '+91 98220 47613' }),
        ravi: node({ id: 'ravi', name: 'Ravi Agencies', type: 'pooled', role: 'distributor', area: 'Chakan MIDC', x: 19, y: 4, anchor: true, lab: [-16, 8, 'end'],
          products: ['medicine', 'packaged food'], verification: 'anchor', trust: 0.95, checkin: { at: 785, operating: true, capacity: 0.5 } }),
        kaveri: node({ id: 'kaveri', name: 'Kaveri Cold Chain Transport', role: 'transporter', area: 'Bhosari', x: 17, y: 11,
          products: ['medicine', 'chilled'], vehicles: [{ kind: 'reefer', label: 'Refrigerated truck', count: 1, capKg: 2000, refrigerated: true, spareKg: 1400 }],
          trust: 0.78, pingedAt: 500, cantReach: ['ravi'], tradedWith: ['ravi'], note: 'Last known position: Chakan tollgate. Van battery and radio telemetry silent since 08:20.' }),
        asha: node({ id: 'asha', name: 'Asha Traders', role: 'wholesaler', area: 'Market Yard', x: 18, y: 27, lab: [16, 24],
          products: ['grain'], trust: 0.74, checkin: { at: 820, operating: true, capacity: 1 } }),
        gandhi: node({ id: 'gandhi', name: 'Gandhi Pharmacy', role: 'pharmacy', area: 'Hadapsar', x: 27.8, y: 27.4, lab: [-16, -8, 'end'],
          products: ['medicine'], verification: 'anchor', trust: 0.8, checkin: { at: 830, operating: true, capacity: 1 }, institution: 'pharmacy' }),
        naidu: node({ id: 'naidu', name: 'Naidu Pharmacy', role: 'pharmacy', area: 'Pimpri', x: 9, y: 13,
          products: ['medicine'], trust: 0.7, checkin: { at: 770, operating: true, capacity: 0.25 } }),
        patel: node({ id: 'patel', name: 'Patel Medicals', role: 'pharmacy', area: 'Chakan', x: 20, y: 3, lab: [16, -6],
          products: ['medicine'], trust: 0.66, pingedAt: 680 }),
        meena: node({ id: 'meena', name: 'Meena Stores', role: 'kirana', area: 'Gadital, Hadapsar', x: 28.5, y: 28.6, lab: [-16, 34, 'end'],
          products: ['grain', 'packaged food'], trust: 0.72, checkin: { at: 800, operating: true, capacity: 0.5 } }),
        raju: node({ id: 'raju', name: 'Raju Provisions', role: 'wholesaler', area: 'Gadital, Hadapsar', x: 28.9, y: 28.1, lab: [16, -6],
          products: ['grain'], trust: 0.7, pingedAt: 120, cantReach: ['meena', 'asha'] }),
        hck: node({ id: 'hck', name: 'Hadapsar Community Kitchen', type: 'pooled', role: 'community kitchen', area: 'Hadapsar', x: 26.4, y: 28.9, lab: [-16, 4, 'end'],
          products: ['grain', 'packaged food'], verification: 'anchor', trust: 0.85, checkin: { at: 840, operating: true, capacity: 1 }, institution: 'community kitchen' }),
        deccan: node({ id: 'deccan', name: 'Deccan Milk Distributors', type: 'pooled', role: 'distributor', area: 'Mundhwa', x: 24.4, y: 22.6, lab: [16, 24],
          products: ['dairy', 'chilled'], vehicles: [{ kind: 'reefer', label: 'Refrigerated van', count: 2, capKg: 600, refrigerated: true, spareKg: 600 }],
          trust: 0.71, tradedWith: ['ravi'], checkin: { at: 810, operating: true, capacity: 0.5 } }),
        baramati: node({ id: 'baramati', name: 'Baramati Agri Chilling', type: 'pooled', role: 'transporter', area: 'Mundhwa', x: 25.8, y: 21.95, lab: [16, -6],
          products: ['chilled', 'frozen', 'medicine'], vehicles: [{ kind: 'reefer', label: 'Refrigerated van', count: 3, capKg: 600, refrigerated: true, spareKg: 1200 }],
          verification: 'anchor', trust: 0.86, tradedWith: ['ravi'], note: 'Vans pre-cooled to 4 °C.', checkin: { at: 790, operating: true, capacity: 0.5 } }),
        mandi: node({ id: 'mandi', name: 'Hadapsar Mandi Association', type: 'pooled', role: 'traders association', area: 'Hadapsar', x: 29.6, y: 29, lab: [16, 18],
          products: ['grain', 'vegetables'], trust: 0.8, checkin: { at: 812, operating: true, capacity: 0.5 } }),
        omsai: node({ id: 'omsai', name: 'Om Sai Pharma Logistics', role: 'transporter', area: 'Yerawada', x: 22, y: 18,
          products: ['medicine'], vehicles: [{ kind: 'reefer', label: 'Refrigerated van', count: 1, capKg: 500, refrigerated: true, spareKg: 500 }],
          verification: 'self', trust: 0.45, checkin: { at: 845, operating: true, capacity: 1 } }),
        sahyadri: node({ id: 'sahyadri', name: 'Sahyadri Agro Cold Chain', type: 'pooled', role: 'transporter', area: 'Wagholi', x: 33, y: 16,
          products: ['chilled', 'frozen'], vehicles: [{ kind: 'reefer', label: 'Refrigerated truck', count: 2, capKg: 2500, refrigerated: true, spareKg: 0 }],
          trust: 0.76, checkin: { at: 790, operating: true, capacity: 0.5 } }),
        shinde: node({ id: 'shinde', name: 'Shinde Cold Storage', type: 'pooled', role: 'warehouse', area: 'Kharadi', x: 29, y: 19,
          products: ['chilled'], vehicles: [{ kind: 'insulated', label: 'Insulated van', count: 1, capKg: 800, refrigerated: false, insulated: true }],
          trust: 0.69, checkin: { at: 815, operating: true, capacity: 0.5 } }),
        kale: node({ id: 'kale', name: 'Kale Roadways', role: 'transporter', area: 'Swargate', x: 17, y: 25,
          products: ['grain', 'packaged food'], vehicles: [{ kind: 'open', label: 'Open truck', count: 2, capKg: 9000, refrigerated: false }],
          trust: 0.64, checkin: { at: 805, operating: true, capacity: 0.5 } }),
        mahalaxmi: node({ id: 'mahalaxmi', name: 'Mahalaxmi Reefer Carriers', role: 'transporter', area: 'Bhosari', x: 16, y: 10, lab: [-16, 4, 'end'],
          products: ['chilled'], vehicles: [{ kind: 'reefer', label: 'Refrigerated truck', count: 1, capKg: 2000, refrigerated: true, spareKg: 2000 }],
          trust: 0.6, pingedAt: 320, cantReach: ['patel'] })
      },
      // Pre-Snap edges from Ravi Agencies' partner upload. side: up = supplies Joshi, down = Joshi serves them.
      edges: [
        { id: 'E1', from: 'ravi', to: 'joshi', product: 'Pharma and FMCG consignments', freq: 'Daily', loadKg: 900, pre: true },
        { id: 'E2', from: 'kaveri', to: 'joshi', product: 'Refrigerated linehaul, Chakan to Swargate', freq: 'Daily', loadKg: 350, cold: true, pre: true },
        { id: 'E3', from: 'asha', to: 'joshi', product: 'Rice and pulses', freq: '3 times a week', loadKg: 1000, pre: true },
        { id: 'E4', from: 'joshi', to: 'gandhi', product: 'Medicines, including cold chain', freq: 'Daily', pre: true },
        { id: 'E5', from: 'joshi', to: 'naidu', product: 'Medicines', freq: 'Daily', pre: true },
        { id: 'E6', from: 'joshi', to: 'patel', product: 'Medicines', freq: '4 times a week', pre: true },
        { id: 'E7', from: 'joshi', to: 'meena', product: 'Rice, oil, packaged food', freq: 'Twice a week', pre: true },
        { id: 'E8', from: 'joshi', to: 'raju', product: 'Rice in 50 kg sacks', freq: 'Weekly', pre: true },
        { id: 'E9', from: 'joshi', to: 'hck', product: 'Rice and vegetables', freq: 'Daily', pre: true },
        { id: 'E10', from: 'ravi', to: 'naidu', product: 'Medicines, direct', freq: 'Weekly', pre: true },
        { id: 'E11', from: 'deccan', to: 'meena', product: 'Milk crates', freq: 'Daily', pre: true },
        { id: 'E12', from: 'asha', to: 'raju', product: 'Rice', freq: 'Weekly', pre: true },
        { id: 'E14', from: 'mahalaxmi', to: 'patel', product: 'Chilled medicines', freq: 'Twice a week', pre: true }
      ],
      stock: [
        { id: 'S1', node: 'ravi', what: 'Insulin (cold chain)', qty: 1600, unit: 'kg' },
        { id: 'S2', node: 'ravi', what: 'Paracetamol', qty: 320, unit: 'cartons' },
        { id: 'S3', node: 'asha', what: 'Rice', qty: 120, unit: 'sacks', kgPer: 50 },
        { id: 'S4', node: 'gandhi', what: 'Insulin (cold chain)', qty: 12, unit: 'kg' },
        { id: 'S7', node: 'joshi', what: 'Diesel credit', qty: 65, unit: 'litre', note: 'Valid at Swargate fuel depot' },
        { id: 'S5', node: 'hck', what: 'Rice', qty: 3, unit: 'sacks', kgPer: 50 },
        { id: 'S6', node: 'deccan', what: 'Milk', qty: 210, unit: 'crates of 12 litre' }
      ],
      needs: [
        { id: 'N1', node: 'gandhi', what: 'Insulin (cold chain)', qty: 400, unit: 'kg', by: 1160, tierClaimed: 0, verifiedBy: ['ravi'], status: 'open', kind: 'goods', at: 700 },
        { id: 'N2', node: 'hck', what: 'Rice', qty: 20, unit: 'sacks', kgPer: 50, by: 1200, tierClaimed: 1, verifiedBy: ['ravi'], status: 'open', kind: 'goods', at: 720 },
        { id: 'N3', node: 'naidu', what: 'Cosmetics and toiletries restock', qty: 140, unit: 'cartons', by: 2600, tierClaimed: 3, verifiedBy: [], status: 'open', kind: 'goods', at: 650 },
        { id: 'N4', node: 'patel', what: 'Paracetamol', qty: 40, unit: 'cartons', by: 2000, tierClaimed: 1, verifiedBy: [], status: 'open', kind: 'goods', at: 600 },
        { id: 'N5', node: 'meena', what: 'Milk', qty: 180, unit: 'litre', by: 1500, tierClaimed: 1, verifiedBy: ['asha', 'gandhi'], status: 'open', kind: 'goods', at: 805 },
        { id: 'N6', node: 'joshi', what: 'Diesel for vans', qty: 200, unit: 'litre', by: 1920, tierClaimed: 2, verifiedBy: [], status: 'open', kind: 'fuel', at: 400 }
      ],
      proposals: [],
      handoffPoints: [
        { id: 'hp_swargate', name: 'Swargate safe point', type: 'Guarded safe point', contact: 'Officer Kadam', hours: '24 hours', safety: 'Police-guarded', fuel: 'Available at Swargate fuel depot', power: 'Available', x: 17.6, y: 24.4, lab: [-14, -12, 'end'] },
        { id: 'hp_market', name: 'Market Yard gate 4', type: 'Mandi', hours: '05:00 to 20:00', safety: 'Guarded', fuel: 'None', power: 'Available', x: 18.6, y: 26.2, lab: [-14, 6, 'end'] },
        { id: 'hp_chakan', name: 'Chakan MIDC truck terminal', type: 'Truck terminal', hours: '24 hours', safety: 'Unguarded', fuel: 'Available', power: 'Limited', x: 19.6, y: 5.6, lab: [-12, 24, 'end'] }
      ],
      tasks: [
        { id: 'T214', needId: 'N1', goods: 'Insulin (cold chain)', short: 'insulin', qty: 400, unit: 'kg', load: '8 insulated cold boxes', note: 'Cold storage lost grid power in Hadapsar. 14 downstream diabetic dispensaries are waiting.', tempC: 4.8, limitC: 8,
          from: 'ravi', to: 'gandhi', by: 1160, cold: true, why: 'insulin must stay below 8 °C', vehiclesNeeded: 1,
          reward: { amount: 4200, from: 'gandhi', what: 'Insulin delivery, Swargate to Hadapsar' }, status: 'offered', offeredAt: 830,
          legs: [
            { n: 1, from: 'ravi', to: 'hp_swargate', km: 31, mins: 85, needs: 'refrigerated', carrier: null, status: 'unassigned', code: '4821', ratePerHour: 1200, hours: 1.5 },
            { n: 2, from: 'hp_swargate', to: 'gandhi', km: 11, mins: 35, needs: 'cold boxes', carrier: 'joshi', status: 'assigned', code: '7306' }
          ] },
        { id: 'T215', needId: 'N2', goods: 'Rice', short: 'rice', qty: 20, unit: 'sacks', kgPer: 50, load: '1,000 kg in 50 kg sacks',
          from: 'asha', to: 'hck', by: 1200, why: 'the kitchen serves 450 meals a day and has 3 sacks left', vehiclesNeeded: 1,
          reward: { amount: 1100, from: 'hck', what: 'Delivery, Market Yard to Hadapsar' }, status: 'offered', offeredAt: 835,
          legs: [{ n: 1, from: 'asha', to: 'hck', km: 12, mins: 40, carrier: 'joshi', status: 'assigned', code: '5190' }] },
        { id: 'T216', needId: 'N3', goods: 'Cosmetics and toiletries', short: 'cosmetics', qty: 140, unit: 'cartons', load: '2,600 kg, 2 van loads',
          from: 'ravi', to: 'naidu', by: 2600, why: 'restock of non-essential goods', vehiclesNeeded: 2,
          reward: { amount: 3400, from: 'naidu', what: 'Delivery, Chakan to Pimpri' }, status: 'offered', offeredAt: 650,
          legs: [{ n: 1, from: 'ravi', to: 'naidu', km: 19, mins: 60, carrier: 'joshi', status: 'assigned', code: '2648' }] }
      ],
      handoffs: [],
      orphans: [
        { id: 'ORP-987', type: 'Stranded vehicle or cargo', goods: 'Tomatoes in crates', qty: 3, unit: 'tonnes', owner: null, ownerText: 'Driver missing, truck MH 14 registration',
          place: 'Pune to Nashik highway, near Chakan', x: 18.6, y: 2.2, condition: 'Spoiling within 1 day', status: 'unclaimed', reportedBy: 'ravi', at: 610, photo: null }
      ],
      custody: [],
      attestations: [],
      obligations: [
        { id: 'I-101', from: 'meena', to: 'deccan', what: '60 litre milk', amount: 2640, source: { kind: 'transfer', id: 'pre' }, status: 'open', at: 640 }
      ],
      notifications: [],
      sms: {
        joshi: [
          { dir: 'in', at: 500, text: 'Relay: Ravi Agencies invited you. Are you still operating? Reply 1 Yes, 2 No.' }
        ],
        kaveri: [
          { dir: 'in', at: 500, text: 'Relay: Ravi Agencies invited you. Are you still operating? Reply 1 Yes, 2 No.' }
        ]
      },
      smsCtx: { joshi: { flow: 'ping' }, kaveri: { flow: 'ping' } },
      log: [
        { at: 300, actor: 'ravi', text: 'Ravi Agencies uploaded 312 partners. Status ping sent.' },
        { at: 610, actor: 'ravi', text: 'Orphan ORP-987 reported: 3 tonnes of tomatoes, near Chakan.' }
      ],
      ui: {}
    };
  }

  var api = { seed: seed };
  root.RelayData = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
