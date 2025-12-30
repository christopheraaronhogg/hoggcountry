<script>
  import { onMount } from 'svelte';

  let { trailContext = {} } = $props();

  let mounted = $state(false);
  let editMode = $state(false);
  let activeSection = $state('exits'); // 'exits', 'medical', 'script', 'personal'

  // Emergency contacts
  let contacts = $state([
    { id: 1, name: '', relationship: '', phone: '' },
  ]);

  // Personal medical info
  let personal = $state({
    bloodType: '',
    allergies: '',
    conditions: '',
    medications: '',
    insurance: '',
    doctorPhone: '',
  });

  // Medical & Dental Access Points from guide (Chapter 13)
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

  // Emergency Call Script
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

  // Road crossings with bailout info (comprehensive AT data)
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

  // Load saved data
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

  // Save data when changed
  function saveData() {
    localStorage.setItem('at-emergency-info', JSON.stringify({ contacts, personal }));
    editMode = false;
  }

  // Add contact
  function addContact() {
    contacts = [...contacts, { id: Date.now(), name: '', relationship: '', phone: '' }];
  }

  // Remove contact
  function removeContact(id) {
    contacts = contacts.filter(c => c.id !== id);
  }

  // Get current mile from context
  let currentMile = $derived(trailContext.currentMile || 0);

  // Find nearest bailout options
  let nearestBailouts = $derived.by(() => {
    const sorted = roadCrossings
      .map(r => ({ ...r, distance: Math.abs(r.mile - currentMile), direction: r.mile >= currentMile ? 'ahead' : 'behind' }))
      .sort((a, b) => a.distance - b.distance);
    return sorted.slice(0, 4);
  });

  // Find next road crossing ahead
  let nextRoad = $derived(roadCrossings.find(r => r.mile > currentMile) || roadCrossings[roadCrossings.length - 1]);

  // Find previous road crossing
  let prevRoad = $derived.by(() => {
    const behind = roadCrossings.filter(r => r.mile < currentMile);
    return behind.length > 0 ? behind[behind.length - 1] : roadCrossings[0];
  });

  // Find nearest medical access points
  let nearestMedical = $derived.by(() => {
    return medicalAccess
      .map(m => ({ ...m, milesAway: Math.abs(m.mile - currentMile), direction: m.mile >= currentMile ? 'ahead' : 'behind' }))
      .sort((a, b) => a.milesAway - b.milesAway)
      .slice(0, 5);
  });

  // Next medical access with full services
  let nextFullMedical = $derived(
    medicalAccess.find(m => m.mile > currentMile && m.urgentCare && m.dental) ||
    medicalAccess[medicalAccess.length - 1]
  );

  // Format phone for tel: link
  function formatPhone(phone) {
    return phone.replace(/[^0-9+]/g, '');
  }

  // Check if any personal info is filled
  let hasPersonalInfo = $derived(
    personal.bloodType || personal.allergies || personal.conditions ||
    personal.medications || personal.insurance || personal.doctorPhone
  );

  // Check if any contacts are filled
  let hasContacts = $derived(contacts.some(c => c.name && c.phone));
</script>

<div class="emergency-card" class:mounted>
  <!-- Alert Header -->
  <header class="card-header">
    <div class="header-icon">🆘</div>
    <div class="header-content">
      <h2 class="header-title">Emergency Info</h2>
      <p class="header-sub">Quick access to critical information</p>
    </div>
    <button class="edit-btn" onclick={() => editMode = !editMode}>
      {editMode ? '✓ Done' : '✏️ Edit'}
    </button>
  </header>

  <!-- Current Location Context -->
  <div class="location-bar">
    <span class="location-icon">📍</span>
    <span class="location-text">Mile <strong>{currentMile}</strong></span>
    <span class="location-divider">•</span>
    <span class="location-landmark">{trailContext.nearestLandmark?.name || 'Springer Mountain'}</span>
  </div>

  <!-- Quick Dial -->
  <div class="quick-dial">
    <a href="tel:911" class="dial-btn emergency">
      <span class="dial-icon">📞</span>
      <span class="dial-label">911</span>
    </a>
    {#if hasContacts}
      {@const firstContact = contacts.find(c => c.name && c.phone)}
      {#if firstContact}
        <a href="tel:{formatPhone(firstContact.phone)}" class="dial-btn primary">
          <span class="dial-icon">👤</span>
          <span class="dial-label">{firstContact.name.split(' ')[0]}</span>
        </a>
      {/if}
    {/if}
  </div>

  <!-- Section Tabs -->
  <div class="section-tabs">
    <button class="stab" class:active={activeSection === 'exits'} onclick={() => activeSection = 'exits'}>
      <span class="stab-icon">🚗</span>
      <span class="stab-text">Exits</span>
    </button>
    <button class="stab" class:active={activeSection === 'medical'} onclick={() => activeSection = 'medical'}>
      <span class="stab-icon">🏥</span>
      <span class="stab-text">Medical</span>
    </button>
    <button class="stab" class:active={activeSection === 'script'} onclick={() => activeSection = 'script'}>
      <span class="stab-icon">📋</span>
      <span class="stab-text">Script</span>
    </button>
    <button class="stab" class:active={activeSection === 'personal'} onclick={() => activeSection = 'personal'}>
      <span class="stab-icon">👤</span>
      <span class="stab-text">Info</span>
    </button>
  </div>

  {#if activeSection === 'exits'}
  <!-- Nearest Bailouts -->
  <section class="section bailout-section">
    <h3 class="section-title">
      <span class="title-icon">🚗</span>
      Nearest Road Crossings
    </h3>

    <div class="bailout-grid">
      <!-- Previous Road -->
      <div class="bailout-card behind">
        <div class="bailout-direction">← Behind</div>
        <div class="bailout-name">{prevRoad.name}</div>
        <div class="bailout-road">{prevRoad.road}</div>
        <div class="bailout-distance">{(currentMile - prevRoad.mile).toFixed(1)} mi back</div>
        <div class="bailout-town">→ {prevRoad.nearestTown} ({prevRoad.townDist} mi)</div>
      </div>

      <!-- Next Road -->
      <div class="bailout-card ahead">
        <div class="bailout-direction">Ahead →</div>
        <div class="bailout-name">{nextRoad.name}</div>
        <div class="bailout-road">{nextRoad.road}</div>
        <div class="bailout-distance">{(nextRoad.mile - currentMile).toFixed(1)} mi ahead</div>
        <div class="bailout-town">→ {nextRoad.nearestTown} ({nextRoad.townDist} mi)</div>
      </div>
    </div>

    <!-- Nearest Hospital -->
    <div class="hospital-info">
      <span class="hospital-icon">🏥</span>
      <span>Nearest hospital: <strong>{nextRoad.hospital}</strong> (~{nextRoad.hospitalDist + Math.round((nextRoad.mile - currentMile))} mi from here)</span>
    </div>
  </section>
  {/if}

  {#if activeSection === 'medical'}
  <!-- Medical Access Points -->
  <section class="section medical-access-section">
    <h3 class="section-title">
      <span class="title-icon">🏥</span>
      Medical & Dental Access
    </h3>

    <!-- Next Full-Service Location -->
    {#if nextFullMedical}
    <div class="next-medical-banner">
      <div class="nmb-header">
        <span class="nmb-icon">➡️</span>
        <span class="nmb-label">Next Full Medical/Dental</span>
      </div>
      <div class="nmb-town">{nextFullMedical.town}</div>
      <div class="nmb-distance">Mile {nextFullMedical.mile} • {(nextFullMedical.mile - currentMile).toFixed(0)} mi ahead</div>
      <div class="nmb-services">
        {#if nextFullMedical.urgentCare}<span class="service-badge uc">Urgent Care</span>{/if}
        {#if nextFullMedical.dental}<span class="service-badge dental">Dental</span>{/if}
        {#if nextFullMedical.hospital}<span class="service-badge hosp">Hospital</span>{/if}
      </div>
      {#if nextFullMedical.notes}
        <div class="nmb-notes">{nextFullMedical.notes}</div>
      {/if}
    </div>
    {/if}

    <!-- All Medical Access Points -->
    <div class="medical-list">
      {#each nearestMedical as access}
        <div class="medical-item" class:behind={access.direction === 'behind'}>
          <div class="mi-header">
            <span class="mi-town">{access.town}</span>
            <span class="mi-distance" class:ahead={access.direction === 'ahead'}>
              {access.milesAway.toFixed(0)} mi {access.direction}
            </span>
          </div>
          <div class="mi-services">
            {#if access.urgentCare}<span class="service-badge uc sm">UC</span>{/if}
            {#if access.dental}<span class="service-badge dental sm">Dental</span>{/if}
            {#if access.hospital}<span class="service-badge hosp sm">ER</span>{/if}
            {#if !access.urgentCare && !access.dental && !access.hospital}
              <span class="service-badge limited sm">Limited</span>
            {/if}
          </div>
          {#if access.notes}
            <div class="mi-notes">{access.notes}</div>
          {/if}
        </div>
      {/each}
    </div>

    <div class="medical-tips">
      <h4>Trail Medical Rules</h4>
      <div class="tips-grid">
        <div class="tip-item">
          <strong>Urgent Care For:</strong>
          <span>Sprains, cuts needing stitches, infections, dehydration</span>
        </div>
        <div class="tip-item alert">
          <strong>Dental Red Flags (Don't Wait):</strong>
          <span>Swelling, tooth fracture, abscess, persistent pain</span>
        </div>
      </div>
    </div>
  </section>
  {/if}

  {#if activeSection === 'script'}
  <!-- Emergency Script -->
  <section class="section script-section">
    <h3 class="section-title">
      <span class="title-icon">📋</span>
      Emergency Call Script
    </h3>

    <div class="script-intro">
      <p><strong>Use this verbatim when calling 911 or rescue services:</strong></p>
    </div>

    <div class="script-card">
      {#each emergencyScript as line, i}
        <div class="script-line" class:editable={line.includes('[')}>
          <span class="line-num">{i + 1}</span>
          <span class="line-text">{line}</span>
        </div>
      {/each}
    </div>

    <div class="script-contacts">
      <h4>Emergency Numbers</h4>
      <div class="contact-grid">
        <a href="tel:911" class="contact-card primary">
          <span class="cc-icon">📞</span>
          <span class="cc-name">911</span>
          <span class="cc-desc">Primary emergency</span>
        </a>
        <a href="tel:18666776677" class="contact-card secondary">
          <span class="cc-icon">🏞️</span>
          <span class="cc-name">NPS</span>
          <span class="cc-desc">1-866-677-6677</span>
        </a>
      </div>
      <p class="contact-note">911 dispatchers can coordinate with local SAR teams. The NPS number is supplementary.</p>
    </div>

    <div class="inreach-section">
      <h4>InReach Bail-Out Method</h4>
      <p>Message a trusted person at home. They can:</p>
      <ul>
        <li>Call hostels and shuttle drivers</li>
        <li>Coordinate rides</li>
        <li>Message instructions back to you</li>
      </ul>
      <div class="example-msg">
        <strong>Example:</strong> "Bad weather. Need off-trail help. I'm near AT mile {currentMile} ({trailContext.nearestLandmark?.name || 'current location'})."
      </div>
    </div>
  </section>
  {/if}

  {#if activeSection === 'personal'}
  <!-- Emergency Contacts -->
  <section class="section contacts-section">
    <h3 class="section-title">
      <span class="title-icon">📱</span>
      Emergency Contacts
    </h3>

    {#if editMode}
      <div class="contacts-edit">
        {#each contacts as contact, i (contact.id)}
          <div class="contact-edit-row">
            <input
              type="text"
              bind:value={contact.name}
              placeholder="Name"
              class="edit-input name-input"
            />
            <input
              type="text"
              bind:value={contact.relationship}
              placeholder="Relation"
              class="edit-input rel-input"
            />
            <input
              type="tel"
              bind:value={contact.phone}
              placeholder="Phone"
              class="edit-input phone-input"
            />
            {#if contacts.length > 1}
              <button class="remove-btn" onclick={() => removeContact(contact.id)}>×</button>
            {/if}
          </div>
        {/each}
        <button class="add-contact-btn" onclick={addContact}>+ Add Contact</button>
      </div>
    {:else if hasContacts}
      <div class="contacts-list">
        {#each contacts.filter(c => c.name && c.phone) as contact}
          <a href="tel:{formatPhone(contact.phone)}" class="contact-row">
            <div class="contact-info">
              <span class="contact-name">{contact.name}</span>
              {#if contact.relationship}
                <span class="contact-rel">{contact.relationship}</span>
              {/if}
            </div>
            <div class="contact-phone">
              <span class="phone-icon">📞</span>
              <span>{contact.phone}</span>
            </div>
          </a>
        {/each}
      </div>
    {:else}
      <div class="empty-state">
        <p>No emergency contacts set. Tap Edit to add.</p>
      </div>
    {/if}
  </section>

  <!-- Personal Medical Info -->
  <section class="section medical-section">
    <h3 class="section-title">
      <span class="title-icon">🏥</span>
      Medical Information
    </h3>

    {#if editMode}
      <div class="medical-edit">
        <div class="edit-row">
          <label>Blood Type</label>
          <select bind:value={personal.bloodType} class="edit-select">
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
        <div class="edit-row">
          <label>Allergies</label>
          <input type="text" bind:value={personal.allergies} placeholder="e.g., Penicillin, bee stings" class="edit-input" />
        </div>
        <div class="edit-row">
          <label>Medical Conditions</label>
          <input type="text" bind:value={personal.conditions} placeholder="e.g., Diabetes, asthma" class="edit-input" />
        </div>
        <div class="edit-row">
          <label>Current Medications</label>
          <input type="text" bind:value={personal.medications} placeholder="e.g., Metformin 500mg" class="edit-input" />
        </div>
        <div class="edit-row">
          <label>Insurance Info</label>
          <input type="text" bind:value={personal.insurance} placeholder="Provider + Policy #" class="edit-input" />
        </div>
        <div class="edit-row">
          <label>Doctor's Phone</label>
          <input type="tel" bind:value={personal.doctorPhone} placeholder="555-123-4567" class="edit-input" />
        </div>
      </div>
    {:else if hasPersonalInfo}
      <div class="medical-display">
        {#if personal.bloodType}
          <div class="med-row">
            <span class="med-label">Blood Type</span>
            <span class="med-value blood-type">{personal.bloodType}</span>
          </div>
        {/if}
        {#if personal.allergies}
          <div class="med-row alert">
            <span class="med-label">⚠️ Allergies</span>
            <span class="med-value">{personal.allergies}</span>
          </div>
        {/if}
        {#if personal.conditions}
          <div class="med-row">
            <span class="med-label">Conditions</span>
            <span class="med-value">{personal.conditions}</span>
          </div>
        {/if}
        {#if personal.medications}
          <div class="med-row">
            <span class="med-label">Medications</span>
            <span class="med-value">{personal.medications}</span>
          </div>
        {/if}
        {#if personal.insurance}
          <div class="med-row">
            <span class="med-label">Insurance</span>
            <span class="med-value">{personal.insurance}</span>
          </div>
        {/if}
        {#if personal.doctorPhone}
          <div class="med-row">
            <span class="med-label">Doctor</span>
            <a href="tel:{formatPhone(personal.doctorPhone)}" class="med-value phone-link">
              📞 {personal.doctorPhone}
            </a>
          </div>
        {/if}
      </div>
    {:else}
      <div class="empty-state">
        <p>No medical info set. Tap Edit to add important details.</p>
      </div>
    {/if}
  </section>

  <!-- Save Button (in edit mode) -->
  {#if editMode}
    <div class="save-section">
      <button class="save-btn" onclick={saveData}>
        ✓ Save Emergency Info
      </button>
    </div>
  {/if}
  {/if}

  <!-- Important Note -->
  <div class="note-section">
    <p>💡 <strong>Tip:</strong> Take a screenshot of this page and keep it accessible even when offline.</p>
  </div>
</div>

<style>
  .emergency-card {
    background: var(--card, #fff);
    border-radius: 16px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    border: 1px solid var(--border);
    overflow: hidden;
    opacity: 0;
    transform: translateY(10px);
    transition: all 0.5s ease;
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
    padding: 1.5rem;
    background: linear-gradient(135deg, #dc2626, #b91c1c);
    color: #fff;
  }

  .header-icon {
    font-size: 2rem;
  }

  .header-content {
    flex: 1;
  }

  .header-title {
    margin: 0;
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
  }

  .header-sub {
    margin: 0.25rem 0 0;
    font-size: 0.9rem;
    opacity: 0.9;
  }

  .edit-btn {
    padding: 0.5rem 1rem;
    border: 2px solid rgba(255,255,255,0.3);
    border-radius: 8px;
    background: rgba(255,255,255,0.1);
    color: #fff;
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .edit-btn:hover {
    background: rgba(255,255,255,0.2);
  }

  /* Location Bar */
  .location-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: var(--bg);
    border-bottom: 1px solid var(--border);
    font-size: 0.9rem;
    color: var(--muted);
  }

  .location-icon {
    font-size: 1rem;
  }

  .location-landmark {
    color: var(--pine);
    font-weight: 600;
  }

  /* Quick Dial */
  .quick-dial {
    display: flex;
    gap: 1rem;
    padding: 1rem 1.5rem;
    background: #fef2f2;
    border-bottom: 1px solid var(--border);
  }

  .dial-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 1rem;
    border-radius: 12px;
    text-decoration: none;
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    font-weight: 600;
    transition: all 0.2s;
  }

  .dial-btn.emergency {
    background: #dc2626;
    color: #fff;
  }

  .dial-btn.emergency:hover {
    background: #b91c1c;
    transform: scale(1.02);
  }

  .dial-btn.primary {
    background: var(--pine);
    color: #fff;
  }

  .dial-btn.primary:hover {
    background: var(--ink);
    transform: scale(1.02);
  }

  .dial-icon {
    font-size: 1.25rem;
  }

  /* Sections */
  .section {
    padding: 1.5rem;
    border-bottom: 1px solid var(--border);
  }

  .section:last-of-type {
    border-bottom: none;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0 0 1rem;
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--pine);
  }

  .title-icon {
    font-size: 1.1rem;
  }

  /* Bailout Grid */
  .bailout-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .bailout-card {
    padding: 1rem;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: #fff;
  }

  .bailout-card.ahead {
    border-color: var(--alpine);
    background: rgba(166, 181, 137, 0.05);
  }

  .bailout-direction {
    font-family: Oswald, sans-serif;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--muted);
    margin-bottom: 0.5rem;
  }

  .bailout-name {
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 600;
    color: var(--ink);
  }

  .bailout-road {
    font-size: 0.8rem;
    color: var(--muted);
    margin-bottom: 0.5rem;
  }

  .bailout-distance {
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--pine);
  }

  .bailout-town {
    font-size: 0.8rem;
    color: var(--muted);
    margin-top: 0.5rem;
  }

  .hospital-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: rgba(220, 38, 38, 0.08);
    border-radius: 8px;
    font-size: 0.9rem;
    color: var(--ink);
  }

  .hospital-icon {
    font-size: 1.1rem;
  }

  /* Contacts */
  .contacts-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .contact-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 10px;
    text-decoration: none;
    color: inherit;
    transition: all 0.2s;
  }

  .contact-row:hover {
    background: var(--bg);
    border-color: var(--alpine);
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
    color: var(--pine);
    font-weight: 600;
  }

  .phone-icon {
    font-size: 1rem;
  }

  /* Edit Mode */
  .contacts-edit, .medical-edit {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .contact-edit-row {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .edit-input {
    padding: 0.6rem 0.75rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    font-family: inherit;
    font-size: 0.9rem;
    color: var(--ink);
    flex: 1;
    min-width: 0;
  }

  .edit-input:focus {
    outline: none;
    border-color: var(--alpine);
  }

  .name-input { flex: 2; }
  .rel-input { flex: 1; }
  .phone-input { flex: 1.5; }

  .edit-select {
    padding: 0.6rem 0.75rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    font-family: inherit;
    font-size: 0.9rem;
    color: var(--ink);
    background: #fff;
    cursor: pointer;
  }

  .edit-row {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .edit-row label {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--muted);
  }

  .remove-btn {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: 1px solid var(--border);
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

  .add-contact-btn {
    padding: 0.6rem 1rem;
    border: 1px dashed var(--border);
    border-radius: 8px;
    background: transparent;
    color: var(--pine);
    font-family: inherit;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .add-contact-btn:hover {
    background: var(--bg);
    border-color: var(--alpine);
  }

  /* Medical Display */
  .medical-display {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .med-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.6rem 0.75rem;
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 8px;
  }

  .med-row.alert {
    background: #fef2f2;
    border-color: #fca5a5;
  }

  .med-label {
    font-size: 0.85rem;
    color: var(--muted);
  }

  .med-value {
    font-weight: 600;
    color: var(--ink);
    text-align: right;
  }

  .blood-type {
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    color: #dc2626;
  }

  .phone-link {
    color: var(--pine);
    text-decoration: none;
  }

  .phone-link:hover {
    text-decoration: underline;
  }

  /* Empty State */
  .empty-state {
    padding: 1.5rem;
    text-align: center;
    color: var(--muted);
    background: var(--bg);
    border-radius: 10px;
    font-size: 0.9rem;
  }

  .empty-state p {
    margin: 0;
  }

  /* Save Section */
  .save-section {
    padding: 1rem 1.5rem;
    background: var(--bg);
    border-top: 1px solid var(--border);
  }

  .save-btn {
    width: 100%;
    padding: 1rem;
    border: none;
    border-radius: 10px;
    background: var(--pine);
    color: #fff;
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .save-btn:hover {
    background: var(--ink);
  }

  /* Note Section */
  .note-section {
    padding: 1rem 1.5rem;
    background: rgba(240, 224, 0, 0.1);
    font-size: 0.85rem;
    color: var(--muted);
  }

  .note-section p {
    margin: 0;
  }

  /* Responsive */
  @media (max-width: 600px) {
    .card-header {
      padding: 1.25rem;
    }

    .header-title {
      font-size: 1.25rem;
    }

    .section {
      padding: 1.25rem;
    }

    .bailout-grid {
      grid-template-columns: 1fr;
    }

    .contact-edit-row {
      flex-wrap: wrap;
    }

    .name-input, .rel-input, .phone-input {
      flex: 1 1 100%;
    }

    .remove-btn {
      position: absolute;
      right: 0;
      top: 0;
    }

    .contact-edit-row {
      position: relative;
      padding-right: 40px;
    }
  }

  /* Section Tabs */
  .section-tabs {
    display: flex;
    gap: 0;
    padding: 0;
    background: var(--bg);
    border-bottom: 1px solid var(--border);
  }

  .stab {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    padding: 0.75rem 0.5rem;
    background: none;
    border: none;
    border-bottom: 3px solid transparent;
    color: var(--muted);
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .stab:hover {
    background: rgba(220, 38, 38, 0.05);
    color: var(--ink);
  }

  .stab.active {
    color: #dc2626;
    border-bottom-color: #dc2626;
    background: rgba(220, 38, 38, 0.08);
  }

  .stab-icon {
    font-size: 1rem;
  }

  .stab-text {
    font-family: Oswald, sans-serif;
    font-weight: 600;
    letter-spacing: 0.02em;
  }

  /* Medical Access Styles */
  .next-medical-banner {
    background: linear-gradient(135deg, #dcfce7, #bbf7d0);
    border: 1px solid #86efac;
    border-radius: 12px;
    padding: 1.25rem;
    margin-bottom: 1.25rem;
  }

  .nmb-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #166534;
    margin-bottom: 0.5rem;
  }

  .nmb-town {
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 700;
    color: #166534;
  }

  .nmb-distance {
    font-size: 0.85rem;
    color: #15803d;
    margin-bottom: 0.5rem;
  }

  .nmb-services {
    display: flex;
    gap: 0.35rem;
    flex-wrap: wrap;
    margin-bottom: 0.5rem;
  }

  .nmb-notes {
    font-size: 0.8rem;
    color: #166534;
    font-style: italic;
  }

  .service-badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 20px;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .service-badge.uc {
    background: #dbeafe;
    color: #1d4ed8;
  }

  .service-badge.dental {
    background: #fef3c7;
    color: #92400e;
  }

  .service-badge.hosp {
    background: #fee2e2;
    color: #991b1b;
  }

  .service-badge.limited {
    background: #f3f4f6;
    color: #6b7280;
  }

  .service-badge.sm {
    font-size: 0.6rem;
    padding: 0.15rem 0.35rem;
  }

  .medical-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1.25rem;
  }

  .medical-item {
    padding: 0.75rem;
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 8px;
  }

  .medical-item.behind {
    opacity: 0.7;
  }

  .mi-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.35rem;
  }

  .mi-town {
    font-weight: 600;
    color: var(--ink);
    font-size: 0.9rem;
  }

  .mi-distance {
    font-size: 0.8rem;
    color: var(--muted);
  }

  .mi-distance.ahead {
    color: #16a34a;
    font-weight: 600;
  }

  .mi-services {
    display: flex;
    gap: 0.25rem;
    margin-bottom: 0.35rem;
  }

  .mi-notes {
    font-size: 0.75rem;
    color: var(--muted);
    font-style: italic;
  }

  .medical-tips {
    background: #fef2f2;
    border: 1px solid #fca5a5;
    border-radius: 10px;
    padding: 1rem;
  }

  .medical-tips h4 {
    margin: 0 0 0.75rem;
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    color: #991b1b;
  }

  .tips-grid {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .tip-item {
    font-size: 0.8rem;
    color: var(--ink);
  }

  .tip-item strong {
    display: block;
    color: var(--pine);
    margin-bottom: 0.15rem;
  }

  .tip-item.alert strong {
    color: #991b1b;
  }

  /* Script Section */
  .script-intro {
    margin-bottom: 1rem;
    font-size: 0.9rem;
    color: var(--ink);
  }

  .script-intro p {
    margin: 0;
  }

  .script-card {
    background: #1e293b;
    border-radius: 10px;
    padding: 1rem;
    margin-bottom: 1.5rem;
    font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
    font-size: 0.8rem;
  }

  .script-line {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.35rem 0;
    color: #e2e8f0;
  }

  .script-line.editable {
    color: #fbbf24;
  }

  .line-num {
    color: #64748b;
    font-size: 0.7rem;
    min-width: 16px;
  }

  .line-text {
    flex: 1;
  }

  .script-contacts h4, .inreach-section h4 {
    margin: 0 0 0.75rem;
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    color: var(--pine);
  }

  .contact-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .contact-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 1rem;
    border-radius: 10px;
    text-decoration: none;
    text-align: center;
    transition: all 0.2s;
  }

  .contact-card.primary {
    background: #dc2626;
    color: #fff;
  }

  .contact-card.primary:hover {
    background: #b91c1c;
    transform: scale(1.02);
  }

  .contact-card.secondary {
    background: var(--pine);
    color: #fff;
  }

  .contact-card.secondary:hover {
    background: var(--ink);
    transform: scale(1.02);
  }

  .cc-icon {
    font-size: 1.5rem;
  }

  .cc-name {
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    font-weight: 700;
  }

  .cc-desc {
    font-size: 0.7rem;
    opacity: 0.9;
  }

  .contact-note {
    font-size: 0.8rem;
    color: var(--muted);
    margin: 0 0 1rem;
  }

  .inreach-section {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 1rem;
  }

  .inreach-section p {
    margin: 0 0 0.5rem;
    font-size: 0.85rem;
    color: var(--ink);
  }

  .inreach-section ul {
    margin: 0 0 0.75rem;
    padding-left: 1.25rem;
    font-size: 0.85rem;
    color: var(--muted);
  }

  .inreach-section li {
    margin-bottom: 0.25rem;
  }

  .example-msg {
    background: #fff;
    border: 1px dashed var(--border);
    border-radius: 8px;
    padding: 0.75rem;
    font-size: 0.85rem;
    color: var(--ink);
  }

  .example-msg strong {
    color: var(--pine);
  }

  @media (max-width: 600px) {
    .section-tabs {
      overflow-x: auto;
    }

    .stab {
      padding: 0.6rem 0.35rem;
      font-size: 0.7rem;
    }

    .stab-icon {
      font-size: 0.9rem;
    }

    .contact-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
