<script>
  import { onMount } from 'svelte';

  let { trailContext = {} } = $props();

  let mounted = $state(false);
  let editMode = $state(false);
  let activeSection = $state('exits');

  let contacts = $state([
    { id: 1, name: '', relationship: '', phone: '' },
  ]);

  let personal = $state({
    bloodType: '',
    allergies: '',
    conditions: '',
    medications: '',
    insurance: '',
    doctorPhone: '',
  });

  const medicalAccess = [
    { mile: 69, town: 'Hiawassee, GA', distance: 11, urgentCare: true, dental: true, hospital: false, notes: 'First strong medical/dental access after Springer' },
    { mile: 110, town: 'Franklin, NC', distance: 10, urgentCare: true, dental: true, hospital: false, notes: 'Excellent for infections, joint injuries' },
    { mile: 275, town: 'Hot Springs, NC', distance: 0, urgentCare: false, dental: true, hospital: false, notes: 'Minor issues only—Asheville (~35 mi) for serious' },
    { mile: 342, town: 'Erwin / Johnson City, TN', distance: 5, urgentCare: true, dental: true, hospital: true, notes: 'One of the strongest early-trail medical zones' },
    { mile: 469, town: 'Damascus / Abingdon, VA', distance: 0, urgentCare: true, dental: true, hospital: false, notes: 'Ideal location to fix problems before they escalate' },
    { mile: 728, town: 'Daleville / Roanoke, VA', distance: 1, urgentCare: true, dental: true, hospital: true, notes: 'TOP-TIER medical/dental zone. Strongly recommended.' },
    { mile: 880, town: 'Waynesboro, VA', distance: 5, urgentCare: true, dental: true, hospital: true, notes: 'Last major fix-it stop before Shenandoah' },
    { mile: 999, town: 'Front Royal, VA', distance: 5, urgentCare: true, dental: true, hospital: false, notes: 'Excellent care before Mid-Atlantic terrain' },
    { mile: 1025, town: 'Harpers Ferry, WV', distance: 0, urgentCare: true, dental: true, hospital: true, notes: 'Major hub with reliable transportation and care' },
    { mile: 1145, town: 'Duncannon, PA', distance: 0, urgentCare: false, dental: false, hospital: false, notes: 'Regional (Harrisburg area). PA is hard on feet!' },
    { mile: 1298, town: 'Delaware Water Gap, PA', distance: 0, urgentCare: true, dental: true, hospital: true, notes: 'Strong overlap of urgent care, dental, and hospital' },
    { mile: 1410, town: 'Bear Mountain, NY', distance: 3, urgentCare: true, dental: true, hospital: false, notes: 'Hudson Valley clinics' },
    { mile: 1538, town: 'Great Barrington, MA', distance: 5, urgentCare: true, dental: true, hospital: false, notes: 'Fairview Hospital Walk-In Care' },
    { mile: 1570, town: 'Dalton, MA', distance: 0, urgentCare: true, dental: true, hospital: false, notes: 'Last reliable access before Vermont' },
    { mile: 1600, town: 'Bennington, VT', distance: 5, urgentCare: true, dental: false, hospital: true, notes: 'First major medical hub in Vermont' },
    { mile: 1700, town: 'Killington, VT', distance: 5, urgentCare: true, dental: true, hospital: false, notes: 'Last significant access before the Whites' },
    { mile: 1747, town: 'Hanover / Lebanon, NH', distance: 0, urgentCare: true, dental: true, hospital: true, notes: 'CRITICAL stop before White Mountains. Fix everything here.' },
    { mile: 1898, town: 'Gorham, NH', distance: 2, urgentCare: false, dental: false, hospital: false, notes: 'Limited—Conway (~30 mi). Do not ignore dental pain!' },
    { mile: 1975, town: 'Andover, ME', distance: 1, urgentCare: false, dental: false, hospital: false, notes: 'Very limited; Rumford (~20 mi). Last before Monson' },
    { mile: 2077, town: 'Monson, ME', distance: 0, urgentCare: false, dental: false, hospital: false, notes: 'ENTER 100-MILE WILDERNESS WITH ZERO ISSUES' },
    { mile: 2183, town: 'Millinocket, ME', distance: 15, urgentCare: true, dental: true, hospital: true, notes: 'Primary medical hub for final stretch' },
  ];

  const emergencyScript = [
    'I am on the Appalachian Trail.',
    'State: [STATE]',
    'Nearest named point: [ROAD/SHELTER/LANDMARK]',
    'I am hiking northbound.',
    'Approximate mile marker: [MILE]',
    'GPS coordinates: [LAT/LONG]',
    'Can I walk: Yes/No/Limited',
    'Nature of problem: [ISSUE]'
  ];

  const roadCrossings = [
    { mile: 0, name: 'Springer Mountain Rd', road: 'FS 42', nearestTown: 'Amicalola Falls', townDist: 8, hospital: 'Dahlonega', hospitalDist: 25 },
    { mile: 8.8, name: 'Three Forks', road: 'FS 58', nearestTown: 'Dahlonega', townDist: 18, hospital: 'Dahlonega', hospitalDist: 18 },
    { mile: 19.3, name: 'Woody Gap', road: 'GA 60', nearestTown: 'Dahlonega', townDist: 12, hospital: 'Dahlonega', hospitalDist: 12 },
    { mile: 30.7, name: 'Neels Gap', road: 'US 19/129', nearestTown: 'Blairsville', townDist: 15, hospital: 'Blairsville', hospitalDist: 15, notes: 'Mountain Crossings outfitter on trail' },
    { mile: 42.4, name: 'Tesnatee Gap', road: 'GA 348', nearestTown: 'Cleveland', townDist: 12, hospital: 'Cleveland', hospitalDist: 12 },
    { mile: 52.8, name: 'Unicoi Gap', road: 'GA 75', nearestTown: 'Hiawassee', townDist: 11, hospital: 'Hiawassee', hospitalDist: 11 },
    { mile: 59.5, name: 'Indian Grave Gap', road: 'GA 75', nearestTown: 'Hiawassee', townDist: 6, hospital: 'Hiawassee', hospitalDist: 6 },
    { mile: 69.4, name: 'Dicks Creek Gap', road: 'US 76', nearestTown: 'Hiawassee', townDist: 8, hospital: 'Hiawassee', hospitalDist: 8 },
    { mile: 78.5, name: 'Bly Gap', road: 'NC/GA Border', nearestTown: 'Franklin', townDist: 18, hospital: 'Franklin', hospitalDist: 18 },
    { mile: 95.7, name: 'Winding Stair Gap', road: 'US 64', nearestTown: 'Franklin', townDist: 10, hospital: 'Franklin', hospitalDist: 10 },
    { mile: 110.3, name: 'Wallace Gap', road: 'US 64', nearestTown: 'Franklin', townDist: 3, hospital: 'Franklin', hospitalDist: 3 },
    { mile: 137.1, name: 'Wesser', road: 'US 19', nearestTown: 'Bryson City', townDist: 12, hospital: 'Bryson City', hospitalDist: 12, notes: 'NOC outfitter' },
    { mile: 165.7, name: 'Fontana Dam', road: 'NC 28', nearestTown: 'Fontana Village', townDist: 2, hospital: 'Bryson City', hospitalDist: 30 },
    { mile: 206.2, name: 'Newfound Gap', road: 'US 441', nearestTown: 'Gatlinburg', townDist: 16, hospital: 'Sevierville', hospitalDist: 26, notes: 'Smokies - permit required' },
    { mile: 241.0, name: 'Davenport Gap', road: 'NC 32', nearestTown: 'Newport', townDist: 20, hospital: 'Newport', hospitalDist: 20 },
    { mile: 255.5, name: 'Max Patch', road: 'NC 1182', nearestTown: 'Hot Springs', townDist: 15, hospital: 'Asheville', hospitalDist: 40 },
    { mile: 273.7, name: 'Hot Springs', road: 'US 25/70', nearestTown: 'Hot Springs', townDist: 0, hospital: 'Asheville', hospitalDist: 35, notes: 'Trail goes through town' },
    { mile: 295.0, name: 'Allen Gap', road: 'NC 208', nearestTown: 'Hot Springs', townDist: 14, hospital: 'Asheville', hospitalDist: 45 },
    { mile: 313.9, name: 'Devils Fork Gap', road: 'NC 212', nearestTown: 'Erwin', townDist: 18, hospital: 'Johnson City', hospitalDist: 35 },
    { mile: 342.3, name: 'Erwin', road: 'TN 395', nearestTown: 'Erwin', townDist: 3, hospital: 'Johnson City', hospitalDist: 20 },
    { mile: 386.1, name: 'Damascus', road: 'US 58', nearestTown: 'Damascus', townDist: 0, hospital: 'Abingdon', hospitalDist: 15, notes: 'Trail goes through town' },
    { mile: 466.0, name: 'VA 16', road: 'VA 16', nearestTown: 'Marion', townDist: 7, hospital: 'Marion', hospitalDist: 7 },
    { mile: 508.7, name: 'Atkins', road: 'VA 11/US 11', nearestTown: 'Atkins', townDist: 1, hospital: 'Marion', hospitalDist: 15 },
    { mile: 550.6, name: 'Pearisburg', road: 'VA 100', nearestTown: 'Pearisburg', townDist: 1, hospital: 'Radford', hospitalDist: 20 },
    { mile: 625.8, name: 'Daleville', road: 'US 220', nearestTown: 'Daleville', townDist: 0, hospital: 'Roanoke', hospitalDist: 10 },
    { mile: 702.3, name: 'Rockfish Gap', road: 'US 250/I-64', nearestTown: 'Waynesboro', townDist: 4, hospital: 'Waynesboro', hospitalDist: 4 },
    { mile: 785.5, name: 'Swift Run Gap', road: 'US 33', nearestTown: 'Elkton', townDist: 8, hospital: 'Harrisonburg', hospitalDist: 25, notes: 'Shenandoah NP' },
    { mile: 808.0, name: 'Thornton Gap', road: 'US 211', nearestTown: 'Luray', townDist: 9, hospital: 'Luray', hospitalDist: 9, notes: 'Shenandoah NP' },
    { mile: 876.8, name: 'Manassas Gap', road: 'VA 55', nearestTown: 'Front Royal', townDist: 4, hospital: 'Front Royal', hospitalDist: 4 },
    { mile: 969.6, name: 'Ashby Gap', road: 'US 50', nearestTown: 'Paris', townDist: 2, hospital: 'Winchester', hospitalDist: 20 },
    { mile: 1025.0, name: 'Harpers Ferry', road: 'US 340', nearestTown: 'Harpers Ferry', townDist: 0, hospital: 'Charles Town', hospitalDist: 8, notes: 'ATC HQ - Psychological halfway' },
    { mile: 1066.1, name: 'Gathland State Park', road: 'MD 67', nearestTown: 'Boonsboro', townDist: 3, hospital: 'Hagerstown', hospitalDist: 15 },
    { mile: 1094.4, name: 'Pen Mar', road: 'PA Line', nearestTown: 'Waynesboro PA', townDist: 5, hospital: 'Waynesboro PA', hospitalDist: 5 },
    { mile: 1141.0, name: 'Duncannon', road: 'PA 274', nearestTown: 'Duncannon', townDist: 0, hospital: 'Harrisburg', hospitalDist: 15, notes: 'Trail goes through town' },
    { mile: 1207.3, name: 'Port Clinton', road: 'PA 61', nearestTown: 'Port Clinton', townDist: 0, hospital: 'Reading', hospitalDist: 20 },
    { mile: 1238.0, name: 'Lehigh Gap', road: 'PA 873', nearestTown: 'Palmerton', townDist: 1, hospital: 'Lehighton', hospitalDist: 8 },
    { mile: 1265.6, name: 'Wind Gap', road: 'PA 33', nearestTown: 'Wind Gap', townDist: 1, hospital: 'Easton', hospitalDist: 15 },
    { mile: 1290.0, name: 'Delaware Water Gap', road: 'PA 611', nearestTown: 'Delaware Water Gap', townDist: 0, hospital: 'East Stroudsburg', hospitalDist: 5 },
    { mile: 1353.8, name: 'Unionville', road: 'NJ 284', nearestTown: 'Unionville', townDist: 1, hospital: 'Warwick NY', hospitalDist: 10 },
    { mile: 1409.6, name: 'Bear Mountain', road: 'US 9W', nearestTown: 'Fort Montgomery', townDist: 2, hospital: 'Newburgh', hospitalDist: 15 },
    { mile: 1433.5, name: 'NY 17/Arden', road: 'NY 17', nearestTown: 'Southfields', townDist: 3, hospital: 'Warwick', hospitalDist: 10 },
    { mile: 1479.5, name: 'Kent', road: 'NY 341', nearestTown: 'Kent', townDist: 1, hospital: 'Danbury CT', hospitalDist: 15 },
    { mile: 1521.1, name: 'Salisbury', road: 'US 44', nearestTown: 'Salisbury', townDist: 1, hospital: 'Sharon', hospitalDist: 8 },
    { mile: 1566.4, name: 'Great Barrington', road: 'MA 23', nearestTown: 'Great Barrington', townDist: 5, hospital: 'Great Barrington', hospitalDist: 5 },
    { mile: 1595.3, name: 'Dalton', road: 'MA 8/9', nearestTown: 'Dalton', townDist: 0, hospital: 'Pittsfield', hospitalDist: 5, notes: 'Trail goes through town' },
    { mile: 1630.5, name: 'North Adams', road: 'MA 2', nearestTown: 'North Adams', townDist: 4, hospital: 'North Adams', hospitalDist: 4 },
    { mile: 1650.3, name: 'Bennington', road: 'VT 9', nearestTown: 'Bennington', townDist: 5, hospital: 'Bennington', hospitalDist: 5 },
    { mile: 1699.3, name: 'Manchester', road: 'VT 11/30', nearestTown: 'Manchester', townDist: 6, hospital: 'Bennington', hospitalDist: 25 },
    { mile: 1741.8, name: 'Killington', road: 'US 4', nearestTown: 'Killington', townDist: 2, hospital: 'Rutland', hospitalDist: 12 },
    { mile: 1773.3, name: 'Hanover', road: 'NH 10', nearestTown: 'Hanover', townDist: 0, hospital: 'Lebanon', hospitalDist: 3, notes: 'Dartmouth College - Trail goes through town' },
    { mile: 1822.8, name: 'Lincoln', road: 'US 3', nearestTown: 'Lincoln', townDist: 3, hospital: 'Plymouth', hospitalDist: 15 },
    { mile: 1843.4, name: 'Franconia Notch', road: 'I-93', nearestTown: 'Lincoln', townDist: 8, hospital: 'Littleton', hospitalDist: 20, notes: 'White Mountains' },
    { mile: 1862.1, name: 'Crawford Notch', road: 'US 302', nearestTown: 'Twin Mountain', townDist: 8, hospital: 'Littleton', hospitalDist: 25, notes: 'White Mountains' },
    { mile: 1879.6, name: 'Pinkham Notch', road: 'NH 16', nearestTown: 'Gorham', townDist: 11, hospital: 'Berlin', hospitalDist: 20, notes: 'AMC visitor center' },
    { mile: 1897.0, name: 'Gorham', road: 'US 2', nearestTown: 'Gorham', townDist: 4, hospital: 'Berlin', hospitalDist: 8 },
    { mile: 1940.1, name: 'Andover', road: 'ME 26', nearestTown: 'Andover', townDist: 8, hospital: 'Rumford', hospitalDist: 25 },
    { mile: 1976.0, name: 'Stratton', road: 'ME 27', nearestTown: 'Stratton', townDist: 5, hospital: 'Farmington', hospitalDist: 35 },
    { mile: 2010.3, name: 'Caratunk', road: 'US 201', nearestTown: 'Caratunk', townDist: 0, hospital: 'Skowhegan', hospitalDist: 35 },
    { mile: 2090.0, name: 'Monson', road: 'ME 15', nearestTown: 'Monson', townDist: 4, hospital: 'Dover-Foxcroft', hospitalDist: 25, notes: 'Last resupply before 100-Mile Wilderness' },
    { mile: 2198.0, name: 'Katahdin', road: 'Baxter Park Rd', nearestTown: 'Millinocket', townDist: 20, hospital: 'Millinocket', hospitalDist: 20, notes: 'Northern Terminus!' },
  ];

  onMount(() => {
    mounted = true;
    const saved = localStorage.getItem('at-emergency-info');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.contacts?.length > 0) contacts = data.contacts;
        if (data.personal) personal = { ...personal, ...data.personal };
      } catch (e) {}
    }
  });

  function saveData() {
    localStorage.setItem('at-emergency-info', JSON.stringify({ contacts, personal }));
    editMode = false;
  }

  function addContact() {
    contacts = [...contacts, { id: Date.now(), name: '', relationship: '', phone: '' }];
  }

  function removeContact(id) {
    contacts = contacts.filter(c => c.id !== id);
  }

  let currentMile = $derived(trailContext.currentMile || 0);

  let nearestBailouts = $derived.by(() => {
    const sorted = roadCrossings
      .map(r => ({ ...r, distance: Math.abs(r.mile - currentMile), direction: r.mile >= currentMile ? 'ahead' : 'behind' }))
      .sort((a, b) => a.distance - b.distance);
    return sorted.slice(0, 4);
  });

  let nextRoad = $derived(roadCrossings.find(r => r.mile > currentMile) || roadCrossings[roadCrossings.length - 1]);

  let prevRoad = $derived.by(() => {
    const behind = roadCrossings.filter(r => r.mile < currentMile);
    return behind.length > 0 ? behind[behind.length - 1] : roadCrossings[0];
  });

  let nearestMedical = $derived.by(() => {
    return medicalAccess
      .map(m => ({ ...m, milesAway: Math.abs(m.mile - currentMile), direction: m.mile >= currentMile ? 'ahead' : 'behind' }))
      .sort((a, b) => a.milesAway - b.milesAway)
      .slice(0, 5);
  });

  let nextFullMedical = $derived(
    medicalAccess.find(m => m.mile > currentMile && m.urgentCare && m.dental) ||
    medicalAccess[medicalAccess.length - 1]
  );

  function formatPhone(phone) {
    return phone.replace(/[^0-9+]/g, '');
  }

  let hasPersonalInfo = $derived(
    personal.bloodType || personal.allergies || personal.conditions ||
    personal.medications || personal.insurance || personal.doctorPhone
  );

  let hasContacts = $derived(contacts.some(c => c.name && c.phone));
</script>

<div class="emergency-card" class:mounted>
  <!-- Alert Header -->
  <header class="card-header">
    <div class="header-alert">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="alert-icon">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    </div>
    <div class="header-text">
      <h2>TRAIL SOS</h2>
      <p>Emergency Information Card</p>
    </div>
    <button class="edit-btn" onclick={() => editMode = !editMode}>
      {editMode ? '✓ SAVE' : '✎ EDIT'}
    </button>
  </header>

  <!-- Location Banner -->
  <div class="location-banner">
    <div class="loc-marker">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    </div>
    <span class="loc-mile">MILE <strong>{currentMile}</strong></span>
    <span class="loc-sep">|</span>
    <span class="loc-landmark">{trailContext.nearestLandmark?.name || 'Springer Mountain'}</span>
  </div>

  <!-- Quick Dial -->
  <div class="quick-dial-section">
    <a href="tel:911" class="dial-btn dial-911">
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
      </svg>
      <span class="dial-text">CALL 911</span>
    </a>
    {#if hasContacts}
      {@const firstContact = contacts.find(c => c.name && c.phone)}
      {#if firstContact}
        <a href="tel:{formatPhone(firstContact.phone)}" class="dial-btn dial-contact">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <span class="dial-text">{firstContact.name.split(' ')[0].toUpperCase()}</span>
        </a>
      {/if}
    {/if}
  </div>

  <!-- Section Tabs -->
  <nav class="section-nav">
    <button class="nav-tab" class:active={activeSection === 'exits'} onclick={() => activeSection = 'exits'}>
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 8 8 12 12 16"/>
        <line x1="16" y1="12" x2="8" y2="12"/>
      </svg>
      <span>EXITS</span>
    </button>
    <button class="nav-tab" class:active={activeSection === 'medical'} onclick={() => activeSection = 'medical'}>
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
      </svg>
      <span>MEDICAL</span>
    </button>
    <button class="nav-tab" class:active={activeSection === 'script'} onclick={() => activeSection = 'script'}>
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
      <span>SCRIPT</span>
    </button>
    <button class="nav-tab" class:active={activeSection === 'personal'} onclick={() => activeSection = 'personal'}>
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
      <span>INFO</span>
    </button>
  </nav>

  {#if activeSection === 'exits'}
  <section class="content-section">
    <h3 class="section-heading">
      <span class="heading-icon">🚗</span>
      NEAREST ROAD CROSSINGS
    </h3>

    <div class="exits-grid">
      <div class="exit-card behind">
        <div class="exit-direction">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          BEHIND
        </div>
        <div class="exit-name">{prevRoad.name}</div>
        <div class="exit-road">{prevRoad.road}</div>
        <div class="exit-distance">{(currentMile - prevRoad.mile).toFixed(1)} mi</div>
        <div class="exit-town">{prevRoad.nearestTown} • {prevRoad.townDist} mi to town</div>
      </div>

      <div class="exit-card ahead">
        <div class="exit-direction">
          AHEAD
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>
        <div class="exit-name">{nextRoad.name}</div>
        <div class="exit-road">{nextRoad.road}</div>
        <div class="exit-distance">{(nextRoad.mile - currentMile).toFixed(1)} mi</div>
        <div class="exit-town">{nextRoad.nearestTown} • {nextRoad.townDist} mi to town</div>
      </div>
    </div>

    <div class="hospital-alert">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
      </svg>
      <div class="hospital-info">
        <span class="hospital-label">NEAREST HOSPITAL</span>
        <span class="hospital-name">{nextRoad.hospital}</span>
        <span class="hospital-dist">~{nextRoad.hospitalDist + Math.round((nextRoad.mile - currentMile))} mi from current position</span>
      </div>
    </div>
  </section>
  {/if}

  {#if activeSection === 'medical'}
  <section class="content-section">
    <h3 class="section-heading">
      <span class="heading-icon">🏥</span>
      MEDICAL & DENTAL ACCESS
    </h3>

    {#if nextFullMedical}
    <div class="next-medical">
      <div class="nm-badge">NEXT FULL SERVICE</div>
      <div class="nm-town">{nextFullMedical.town}</div>
      <div class="nm-meta">Mile {nextFullMedical.mile} • {(nextFullMedical.mile - currentMile).toFixed(0)} mi ahead</div>
      <div class="nm-services">
        {#if nextFullMedical.urgentCare}<span class="svc-badge uc">URGENT CARE</span>{/if}
        {#if nextFullMedical.dental}<span class="svc-badge dental">DENTAL</span>{/if}
        {#if nextFullMedical.hospital}<span class="svc-badge er">HOSPITAL</span>{/if}
      </div>
      {#if nextFullMedical.notes}
        <div class="nm-notes">{nextFullMedical.notes}</div>
      {/if}
    </div>
    {/if}

    <div class="medical-list">
      {#each nearestMedical as access}
        <div class="med-item" class:past={access.direction === 'behind'}>
          <div class="med-header">
            <span class="med-town">{access.town}</span>
            <span class="med-dist" class:ahead={access.direction === 'ahead'}>
              {access.milesAway.toFixed(0)} mi {access.direction === 'ahead' ? '→' : '←'}
            </span>
          </div>
          <div class="med-services">
            {#if access.urgentCare}<span class="svc-sm uc">UC</span>{/if}
            {#if access.dental}<span class="svc-sm dental">DEN</span>{/if}
            {#if access.hospital}<span class="svc-sm er">ER</span>{/if}
            {#if !access.urgentCare && !access.dental && !access.hospital}
              <span class="svc-sm limited">LIMITED</span>
            {/if}
          </div>
          {#if access.notes}
            <div class="med-notes">{access.notes}</div>
          {/if}
        </div>
      {/each}
    </div>

    <div class="medical-alert">
      <div class="alert-title">⚠️ DENTAL RED FLAGS</div>
      <p>Swelling, tooth fracture, abscess, persistent pain — DO NOT WAIT. Get care immediately.</p>
    </div>
  </section>
  {/if}

  {#if activeSection === 'script'}
  <section class="content-section">
    <h3 class="section-heading">
      <span class="heading-icon">📋</span>
      EMERGENCY CALL SCRIPT
    </h3>

    <p class="script-intro">Read this verbatim when calling 911 or rescue services:</p>

    <div class="script-block">
      <div class="script-header">
        <span class="script-title">// 911 CALL SCRIPT</span>
      </div>
      {#each emergencyScript as line, i}
        <div class="script-line" class:highlight={line.includes('[')}>
          <span class="line-num">{String(i + 1).padStart(2, '0')}</span>
          <span class="line-code">{line}</span>
        </div>
      {/each}
    </div>

    <div class="emergency-numbers">
      <h4>EMERGENCY CONTACTS</h4>
      <div class="num-grid">
        <a href="tel:911" class="num-card primary">
          <span class="num-icon">📞</span>
          <span class="num-name">911</span>
          <span class="num-desc">Primary Emergency</span>
        </a>
        <a href="tel:18666776677" class="num-card secondary">
          <span class="num-icon">🏞️</span>
          <span class="num-name">NPS</span>
          <span class="num-desc">1-866-677-6677</span>
        </a>
      </div>
    </div>

    <div class="inreach-box">
      <h4>📡 INREACH BAIL-OUT</h4>
      <p>Message a trusted contact at home. They can call hostels, coordinate shuttles, and relay information back to you.</p>
      <div class="example-message">
        <strong>EXAMPLE:</strong> "Bad weather. Need off-trail help. AT mile {currentMile} near {trailContext.nearestLandmark?.name || 'current position'}."
      </div>
    </div>
  </section>
  {/if}

  {#if activeSection === 'personal'}
  <section class="content-section">
    <h3 class="section-heading">
      <span class="heading-icon">📱</span>
      EMERGENCY CONTACTS
    </h3>

    {#if editMode}
      <div class="edit-contacts">
        {#each contacts as contact, i (contact.id)}
          <div class="edit-row">
            <input type="text" bind:value={contact.name} placeholder="Name" class="edit-field name" />
            <input type="text" bind:value={contact.relationship} placeholder="Relation" class="edit-field rel" />
            <input type="tel" bind:value={contact.phone} placeholder="Phone" class="edit-field phone" />
            {#if contacts.length > 1}
              <button class="remove-btn" onclick={() => removeContact(contact.id)}>×</button>
            {/if}
          </div>
        {/each}
        <button class="add-btn" onclick={addContact}>+ ADD CONTACT</button>
      </div>
    {:else if hasContacts}
      <div class="contacts-display">
        {#each contacts.filter(c => c.name && c.phone) as contact}
          <a href="tel:{formatPhone(contact.phone)}" class="contact-item">
            <div class="contact-info">
              <span class="contact-name">{contact.name}</span>
              {#if contact.relationship}
                <span class="contact-rel">{contact.relationship}</span>
              {/if}
            </div>
            <div class="contact-phone">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              <span>{contact.phone}</span>
            </div>
          </a>
        {/each}
      </div>
    {:else}
      <div class="empty-state">
        <p>No emergency contacts. Tap EDIT to add.</p>
      </div>
    {/if}

    <h3 class="section-heading sub">
      <span class="heading-icon">🏥</span>
      MEDICAL INFORMATION
    </h3>

    {#if editMode}
      <div class="edit-medical">
        <div class="med-field">
          <label>Blood Type</label>
          <select bind:value={personal.bloodType}>
            <option value="">Select...</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
          </select>
        </div>
        <div class="med-field">
          <label>Allergies</label>
          <input type="text" bind:value={personal.allergies} placeholder="e.g., Penicillin, bee stings" />
        </div>
        <div class="med-field">
          <label>Medical Conditions</label>
          <input type="text" bind:value={personal.conditions} placeholder="e.g., Diabetes, asthma" />
        </div>
        <div class="med-field">
          <label>Current Medications</label>
          <input type="text" bind:value={personal.medications} placeholder="e.g., Metformin 500mg" />
        </div>
        <div class="med-field">
          <label>Insurance Info</label>
          <input type="text" bind:value={personal.insurance} placeholder="Provider + Policy #" />
        </div>
        <div class="med-field">
          <label>Doctor's Phone</label>
          <input type="tel" bind:value={personal.doctorPhone} placeholder="555-123-4567" />
        </div>
      </div>
    {:else if hasPersonalInfo}
      <div class="medical-display">
        {#if personal.bloodType}
          <div class="info-row">
            <span class="info-label">Blood Type</span>
            <span class="info-value blood">{personal.bloodType}</span>
          </div>
        {/if}
        {#if personal.allergies}
          <div class="info-row alert">
            <span class="info-label">⚠️ Allergies</span>
            <span class="info-value">{personal.allergies}</span>
          </div>
        {/if}
        {#if personal.conditions}
          <div class="info-row">
            <span class="info-label">Conditions</span>
            <span class="info-value">{personal.conditions}</span>
          </div>
        {/if}
        {#if personal.medications}
          <div class="info-row">
            <span class="info-label">Medications</span>
            <span class="info-value">{personal.medications}</span>
          </div>
        {/if}
        {#if personal.insurance}
          <div class="info-row">
            <span class="info-label">Insurance</span>
            <span class="info-value">{personal.insurance}</span>
          </div>
        {/if}
        {#if personal.doctorPhone}
          <div class="info-row">
            <span class="info-label">Doctor</span>
            <a href="tel:{formatPhone(personal.doctorPhone)}" class="info-value phone-link">📞 {personal.doctorPhone}</a>
          </div>
        {/if}
      </div>
    {:else}
      <div class="empty-state">
        <p>No medical info. Tap EDIT to add important details.</p>
      </div>
    {/if}

    {#if editMode}
      <button class="save-btn" onclick={saveData}>✓ SAVE EMERGENCY INFO</button>
    {/if}
  </section>
  {/if}

  <!-- Tip Footer -->
  <div class="tip-footer">
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
    <span>Take a screenshot of this page for offline access</span>
  </div>

  <!-- Guide Link -->
  <a href="/guide/14-medical-planning" class="guide-link">
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
    <span>Read Medical & Dental Access Guide</span>
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  </a>
</div>

<style>
  .emergency-card {
    background: var(--bg, #f8f5f0);
    border: 2px solid #dc2626;
    border-radius: 12px;
    overflow: hidden;
    opacity: 0;
    transform: translateY(12px);
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .emergency-card.mounted {
    opacity: 1;
    transform: translateY(0);
  }

  /* Header */
  .card-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem 1.5rem;
    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
    border-bottom: 2px solid #991b1b;
  }

  .header-alert {
    width: 48px;
    height: 48px;
    background: rgba(255,255,255,0.15);
    border: 2px solid rgba(255,255,255,0.3);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .alert-icon {
    width: 28px;
    height: 28px;
    color: #fff;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }

  .header-text h2 {
    margin: 0;
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: #fff;
    letter-spacing: 0.1em;
  }

  .header-text p {
    margin: 0.15rem 0 0;
    font-size: 0.75rem;
    color: rgba(255,255,255,0.8);
    letter-spacing: 0.05em;
  }

  .header-text {
    flex: 1;
  }

  .edit-btn {
    padding: 0.5rem 1rem;
    background: rgba(255,255,255,0.15);
    border: 2px solid rgba(255,255,255,0.3);
    border-radius: 8px;
    color: #fff;
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    cursor: pointer;
    transition: all 0.2s;
  }

  .edit-btn:hover {
    background: rgba(255,255,255,0.25);
  }

  /* Location Banner */
  .location-banner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: #1e293b;
    color: #fff;
    font-size: 0.85rem;
  }

  .loc-marker {
    color: #f87171;
  }

  .loc-mile {
    font-family: Oswald, sans-serif;
    letter-spacing: 0.05em;
  }

  .loc-mile strong {
    font-size: 1.1rem;
    color: #fbbf24;
  }

  .loc-sep {
    color: #64748b;
  }

  .loc-landmark {
    color: #94a3b8;
  }

  /* Quick Dial */
  .quick-dial-section {
    display: flex;
    gap: 1rem;
    padding: 1rem 1.5rem;
    background: #fef2f2;
    border-bottom: 2px solid var(--border);
  }

  .dial-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 1rem;
    border-radius: 10px;
    text-decoration: none;
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    transition: all 0.2s;
    border: 2px solid;
  }

  .dial-911 {
    background: #dc2626;
    border-color: #b91c1c;
    color: #fff;
  }

  .dial-911:hover {
    background: #b91c1c;
    transform: scale(1.02);
  }

  .dial-contact {
    background: var(--pine, #3d5a46);
    border-color: var(--alpine, #2d4a36);
    color: #fff;
  }

  .dial-contact:hover {
    background: var(--alpine);
    transform: scale(1.02);
  }

  /* Section Nav */
  .section-nav {
    display: flex;
    background: #fff;
    border-bottom: 2px solid var(--border);
  }

  .nav-tab {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 0.75rem 0.5rem;
    background: none;
    border: none;
    border-bottom: 3px solid transparent;
    color: var(--muted);
    font-family: Oswald, sans-serif;
    font-size: 0.65rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    cursor: pointer;
    transition: all 0.2s;
  }

  .nav-tab:hover {
    background: rgba(220, 38, 38, 0.05);
    color: var(--ink);
  }

  .nav-tab.active {
    color: #dc2626;
    border-bottom-color: #dc2626;
    background: rgba(220, 38, 38, 0.08);
  }

  /* Content Section */
  .content-section {
    padding: 1.5rem;
  }

  .section-heading {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0 0 1rem;
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 700;
    color: #dc2626;
    letter-spacing: 0.08em;
  }

  .section-heading.sub {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 2px solid var(--border);
  }

  .heading-icon {
    font-size: 1rem;
  }

  /* Exits Grid */
  .exits-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .exit-card {
    padding: 1rem;
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 10px;
  }

  .exit-card.behind {
    border-left: 4px solid #64748b;
  }

  .exit-card.ahead {
    border-left: 4px solid #22c55e;
  }

  .exit-direction {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-family: Oswald, sans-serif;
    font-size: 0.65rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: var(--muted);
    margin-bottom: 0.5rem;
  }

  .exit-card.ahead .exit-direction {
    justify-content: flex-end;
    color: #16a34a;
  }

  .exit-name {
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 700;
    color: var(--ink);
  }

  .exit-road {
    font-size: 0.8rem;
    color: var(--muted);
    margin-bottom: 0.5rem;
  }

  .exit-distance {
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 700;
    color: #dc2626;
  }

  .exit-town {
    font-size: 0.75rem;
    color: var(--muted);
    margin-top: 0.35rem;
  }

  .hospital-alert {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 1rem;
    background: #fef2f2;
    border: 2px solid #fca5a5;
    border-radius: 10px;
  }

  .hospital-alert svg {
    color: #dc2626;
    flex-shrink: 0;
    margin-top: 0.1rem;
  }

  .hospital-info {
    display: flex;
    flex-direction: column;
  }

  .hospital-label {
    font-family: Oswald, sans-serif;
    font-size: 0.65rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: #dc2626;
  }

  .hospital-name {
    font-weight: 700;
    color: var(--ink);
    font-size: 0.95rem;
  }

  .hospital-dist {
    font-size: 0.8rem;
    color: var(--muted);
  }

  /* Medical Section */
  .next-medical {
    background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
    border: 2px solid #86efac;
    border-radius: 10px;
    padding: 1.25rem;
    margin-bottom: 1.25rem;
  }

  .nm-badge {
    font-family: Oswald, sans-serif;
    font-size: 0.65rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: #166534;
    margin-bottom: 0.35rem;
  }

  .nm-town {
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 700;
    color: #166534;
  }

  .nm-meta {
    font-size: 0.85rem;
    color: #15803d;
    margin-bottom: 0.5rem;
  }

  .nm-services {
    display: flex;
    gap: 0.35rem;
    flex-wrap: wrap;
    margin-bottom: 0.5rem;
  }

  .nm-notes {
    font-size: 0.8rem;
    color: #166534;
    font-style: italic;
  }

  .svc-badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-family: Oswald, sans-serif;
    font-size: 0.65rem;
    font-weight: 600;
    letter-spacing: 0.05em;
  }

  .svc-badge.uc {
    background: #dbeafe;
    color: #1d4ed8;
    border: 1px solid #93c5fd;
  }

  .svc-badge.dental {
    background: #fef3c7;
    color: #92400e;
    border: 1px solid #fcd34d;
  }

  .svc-badge.er {
    background: #fee2e2;
    color: #991b1b;
    border: 1px solid #fca5a5;
  }

  .svc-sm {
    font-size: 0.55rem;
    padding: 0.15rem 0.35rem;
  }

  .svc-sm.limited {
    background: #f3f4f6;
    color: #6b7280;
    border: 1px solid #d1d5db;
  }

  .medical-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1.25rem;
  }

  .med-item {
    padding: 0.75rem;
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 8px;
  }

  .med-item.past {
    opacity: 0.6;
  }

  .med-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.35rem;
  }

  .med-town {
    font-weight: 600;
    color: var(--ink);
    font-size: 0.9rem;
  }

  .med-dist {
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    color: var(--muted);
  }

  .med-dist.ahead {
    color: #16a34a;
    font-weight: 600;
  }

  .med-services {
    display: flex;
    gap: 0.25rem;
    margin-bottom: 0.35rem;
  }

  .med-notes {
    font-size: 0.75rem;
    color: var(--muted);
    font-style: italic;
  }

  .medical-alert {
    background: #fef2f2;
    border: 2px solid #fca5a5;
    border-radius: 10px;
    padding: 1rem;
  }

  .alert-title {
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 700;
    color: #991b1b;
    margin-bottom: 0.35rem;
  }

  .medical-alert p {
    margin: 0;
    font-size: 0.85rem;
    color: #7f1d1d;
  }

  /* Script Section */
  .script-intro {
    font-size: 0.9rem;
    color: var(--ink);
    margin-bottom: 1rem;
  }

  .script-block {
    background: #0f172a;
    border: 2px solid #334155;
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 1.5rem;
    font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
    font-size: 0.8rem;
  }

  .script-header {
    padding: 0.5rem 1rem;
    background: #1e293b;
    border-bottom: 1px solid #334155;
  }

  .script-title {
    color: #64748b;
    font-size: 0.7rem;
  }

  .script-line {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.35rem 1rem;
    color: #e2e8f0;
  }

  .script-line.highlight {
    background: rgba(251, 191, 36, 0.1);
    color: #fbbf24;
  }

  .line-num {
    color: #475569;
    font-size: 0.7rem;
    min-width: 20px;
  }

  .line-code {
    flex: 1;
  }

  .emergency-numbers h4,
  .inreach-box h4 {
    margin: 0 0 0.75rem;
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--pine);
    letter-spacing: 0.05em;
  }

  .num-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .num-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 1rem;
    border-radius: 10px;
    text-decoration: none;
    text-align: center;
    transition: all 0.2s;
    border: 2px solid;
  }

  .num-card.primary {
    background: #dc2626;
    border-color: #b91c1c;
    color: #fff;
  }

  .num-card.primary:hover {
    background: #b91c1c;
    transform: scale(1.02);
  }

  .num-card.secondary {
    background: var(--pine);
    border-color: var(--alpine);
    color: #fff;
  }

  .num-card.secondary:hover {
    background: var(--alpine);
    transform: scale(1.02);
  }

  .num-icon {
    font-size: 1.5rem;
  }

  .num-name {
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    font-weight: 700;
  }

  .num-desc {
    font-size: 0.7rem;
    opacity: 0.9;
  }

  .inreach-box {
    background: var(--bg);
    border: 2px solid var(--border);
    border-radius: 10px;
    padding: 1rem;
  }

  .inreach-box p {
    margin: 0 0 0.75rem;
    font-size: 0.85rem;
    color: var(--ink);
  }

  .example-message {
    background: #fff;
    border: 2px dashed var(--border);
    border-radius: 8px;
    padding: 0.75rem;
    font-size: 0.85rem;
    color: var(--ink);
  }

  .example-message strong {
    color: var(--pine);
  }

  /* Personal Section */
  .edit-contacts {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .edit-row {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .edit-field {
    padding: 0.6rem 0.75rem;
    border: 2px solid var(--border);
    border-radius: 8px;
    font-size: 0.85rem;
    color: var(--ink);
    flex: 1;
    min-width: 0;
  }

  .edit-field:focus {
    outline: none;
    border-color: #dc2626;
  }

  .edit-field.name { flex: 2; }
  .edit-field.rel { flex: 1; }
  .edit-field.phone { flex: 1.5; }

  .remove-btn {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    border: 2px solid var(--border);
    background: #fff;
    color: var(--muted);
    font-size: 1.25rem;
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;
  }

  .remove-btn:hover {
    background: #fef2f2;
    border-color: #dc2626;
    color: #dc2626;
  }

  .add-btn {
    padding: 0.6rem 1rem;
    border: 2px dashed var(--border);
    border-radius: 8px;
    background: transparent;
    color: #dc2626;
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .add-btn:hover {
    background: rgba(220, 38, 38, 0.05);
    border-color: #dc2626;
  }

  .contacts-display {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .contact-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 10px;
    text-decoration: none;
    color: inherit;
    transition: all 0.2s;
  }

  .contact-item:hover {
    background: rgba(220, 38, 38, 0.05);
    border-color: #dc2626;
  }

  .contact-name {
    font-weight: 600;
    color: var(--ink);
  }

  .contact-rel {
    font-size: 0.8rem;
    color: var(--muted);
    margin-left: 0.5rem;
  }

  .contact-phone {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    color: #dc2626;
    font-weight: 600;
    font-size: 0.9rem;
  }

  .edit-medical {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .med-field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .med-field label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .med-field input,
  .med-field select {
    padding: 0.6rem 0.75rem;
    border: 2px solid var(--border);
    border-radius: 8px;
    font-size: 0.85rem;
    color: var(--ink);
    background: #fff;
  }

  .med-field input:focus,
  .med-field select:focus {
    outline: none;
    border-color: #dc2626;
  }

  .medical-display {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.6rem 0.75rem;
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 8px;
  }

  .info-row.alert {
    background: #fef2f2;
    border-color: #fca5a5;
  }

  .info-label {
    font-size: 0.8rem;
    color: var(--muted);
  }

  .info-value {
    font-weight: 600;
    color: var(--ink);
    text-align: right;
  }

  .info-value.blood {
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    color: #dc2626;
  }

  .phone-link {
    color: #dc2626;
    text-decoration: none;
  }

  .phone-link:hover {
    text-decoration: underline;
  }

  .empty-state {
    padding: 1.5rem;
    text-align: center;
    color: var(--muted);
    background: var(--bg);
    border: 2px dashed var(--border);
    border-radius: 10px;
    font-size: 0.9rem;
  }

  .empty-state p {
    margin: 0;
  }

  .save-btn {
    width: 100%;
    margin-top: 1rem;
    padding: 1rem;
    border: none;
    border-radius: 10px;
    background: #dc2626;
    color: #fff;
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    cursor: pointer;
    transition: all 0.2s;
  }

  .save-btn:hover {
    background: #b91c1c;
  }

  /* Tip Footer */
  .tip-footer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: rgba(251, 191, 36, 0.15);
    border-top: 2px solid var(--border);
    font-size: 0.8rem;
    color: #92400e;
  }

  /* Guide Link */
  .guide-link {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 1rem 1.5rem;
    background: var(--pine, #3d5a46);
    color: #fff;
    text-decoration: none;
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0.03em;
    transition: background 0.2s ease;
  }

  .guide-link:hover {
    background: var(--alpine, #2d4a36);
  }

  /* Responsive */
  @media (max-width: 640px) {
    .exits-grid {
      grid-template-columns: 1fr;
    }

    .edit-row {
      flex-wrap: wrap;
    }

    .edit-field.name,
    .edit-field.rel,
    .edit-field.phone {
      flex: 1 1 100%;
    }

    .num-grid {
      grid-template-columns: 1fr;
    }

    .nav-tab {
      padding: 0.75rem 0.5rem;
      font-size: 0.7rem;
    }

    .nav-tab svg {
      width: 20px;
      height: 20px;
    }

    .dial-btn {
      padding: 1rem;
    }

    .content-section {
      padding: 1rem;
    }
  }
</style>
