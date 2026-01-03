<script>
  // ProtoF: Ranger Station - Vintage National Parks Homepage
  // WPA poster aesthetic inspired by 1930s-40s national park posters
  // OFFICIAL TRAIL GUIDE prepared by C. Hogg for J. "HoggCountry" Hogg
</script>

<div class="ranger-station">
  <!-- ========================================== -->
  <!-- HEADER - Vintage Badge Logo Navigation    -->
  <!-- ========================================== -->
  <header class="ranger-header">
    <div class="ranger-header-inner">
      <!-- Vintage Badge Logo -->
      <a href="/" class="ranger-logo">
        <div class="logo-badge">
          <div class="badge-outer">
            <div class="badge-inner">
              <span class="badge-mountain">
                <svg viewBox="0 0 60 30" fill="currentColor">
                  <path d="M0 30 L15 8 L25 18 L35 5 L50 20 L60 30 Z" />
                </svg>
              </span>
              <span class="badge-text">HOGG</span>
              <span class="badge-text-sub">COUNTRY</span>
            </div>
          </div>
          <span class="badge-est">EST. 2024</span>
        </div>
      </a>

      <!-- Vintage Navigation -->
      <nav class="ranger-nav">
        <a href="/guide" class="nav-link">
          <span class="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </span>
          Field Guide
        </a>
        <a href="/tools" class="nav-link">
          <span class="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          </span>
          Trail Tools
        </a>
        <a href="/trips" class="nav-link">
          <span class="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </span>
          Trip Reports
        </a>
        <a href="/videos" class="nav-link">
          <span class="nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </span>
          Videos
        </a>
      </nav>

      <!-- Mobile Menu Button -->
      <button class="mobile-menu-btn" aria-label="Menu">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
    </div>
  </header>

  <!-- ========================================== -->
  <!-- HERO - WPA Poster Style                   -->
  <!-- ========================================== -->
  <section class="ranger-hero">
    <!-- Decorative vintage border -->
    <div class="hero-border">
      <div class="border-corner border-tl"></div>
      <div class="border-corner border-tr"></div>
      <div class="border-corner border-bl"></div>
      <div class="border-corner border-br"></div>
    </div>

    <!-- Mountain silhouette background -->
    <div class="hero-mountains">
      <svg viewBox="0 0 1200 400" preserveAspectRatio="xMidYMax slice">
        <defs>
          <linearGradient id="mountain-grad-1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#4d594a;stop-opacity:0.9" />
            <stop offset="100%" style="stop-color:#3a443a;stop-opacity:1" />
          </linearGradient>
          <linearGradient id="mountain-grad-2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#5d6b5a;stop-opacity:0.7" />
            <stop offset="100%" style="stop-color:#4d594a;stop-opacity:0.8" />
          </linearGradient>
          <linearGradient id="mountain-grad-3" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#6d7d6a;stop-opacity:0.5" />
            <stop offset="100%" style="stop-color:#5d6b5a;stop-opacity:0.6" />
          </linearGradient>
        </defs>
        <!-- Far mountains -->
        <path d="M0 400 L0 320 Q150 280 300 300 T600 260 T900 290 T1200 270 L1200 400 Z" fill="url(#mountain-grad-3)" />
        <!-- Mid mountains -->
        <path d="M0 400 L0 350 L150 280 L250 320 L400 240 L550 300 L700 220 L850 280 L950 200 L1100 260 L1200 190 L1200 400 Z" fill="url(#mountain-grad-2)" />
        <!-- Near mountains -->
        <path d="M0 400 L0 380 L100 320 L200 360 L350 280 L500 340 L650 260 L800 320 L900 240 L1050 300 L1200 230 L1200 400 Z" fill="url(#mountain-grad-1)" />
        <!-- Trees silhouette -->
        <g fill="#2b3029" opacity="0.6">
          <path d="M50 400 L50 370 L45 370 L55 355 L48 355 L58 340 L52 340 L60 320 L68 340 L62 340 L72 355 L65 355 L75 370 L70 370 L70 400 Z" />
          <path d="M120 400 L120 360 L112 360 L128 330 L118 330 L135 290 L152 330 L142 330 L158 360 L150 360 L150 400 Z" />
          <path d="M200 400 L200 375 L195 375 L205 360 L198 360 L210 340 L222 360 L215 360 L225 375 L220 375 L220 400 Z" />
          <path d="M980 400 L980 365 L972 365 L988 335 L978 335 L995 295 L1012 335 L1002 335 L1018 365 L1010 365 L1010 400 Z" />
          <path d="M1080 400 L1080 370 L1075 370 L1085 355 L1078 355 L1090 335 L1102 355 L1095 355 L1105 370 L1100 370 L1100 400 Z" />
          <path d="M1150 400 L1150 380 L1145 380 L1155 365 L1150 365 L1160 350 L1170 365 L1165 365 L1175 380 L1170 380 L1170 400 Z" />
        </g>
      </svg>
    </div>

    <!-- Hero content -->
    <div class="hero-content">
      <div class="hero-stamp">
        <span class="stamp-text">OFFICIAL EXPEDITION</span>
        <span class="stamp-year">FEBRUARY 2026</span>
      </div>

      <h1 class="hero-title">
        <span class="title-prefix">THE</span>
        <span class="title-main">APPALACHIAN TRAIL</span>
        <span class="title-suffix">EXPEDITION HANDBOOK</span>
      </h1>

      <p class="hero-subtitle">
        An Official Trail Guide to 2,194 Miles of America's Footpath
      </p>

      <div class="hero-route">
        <span class="route-start">
          <svg viewBox="0 0 24 24" fill="currentColor" class="pin-icon">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" fill="#f5f2e8" />
          </svg>
          Springer Mtn, GA
        </span>
        <span class="route-line">
          <svg viewBox="0 0 120 20" preserveAspectRatio="none">
            <path d="M0 10 Q30 5 60 10 T120 10" stroke="currentColor" stroke-width="2" fill="none" stroke-dasharray="4 4" />
          </svg>
        </span>
        <span class="route-end">
          Mt. Katahdin, ME
          <svg viewBox="0 0 24 24" fill="currentColor" class="pin-icon">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" fill="#f5f2e8" />
          </svg>
        </span>
      </div>

      <div class="hero-cta">
        <a href="/guide" class="cta-primary">
          <span class="cta-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </span>
          Read the Field Guide
        </a>
        <a href="/tools" class="cta-secondary">
          <span class="cta-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </span>
          Explore Trail Tools
        </a>
      </div>
    </div>

    <!-- Decorative blaze marks -->
    <div class="hero-blazes">
      <div class="blaze blaze-1"></div>
      <div class="blaze blaze-2"></div>
    </div>
  </section>

  <!-- ========================================== -->
  <!-- HIKER CERTIFICATE - Vintage Badge Style   -->
  <!-- ========================================== -->
  <section class="ranger-mission">
    <div class="mission-container">
      <!-- Official Hiker Badge -->
      <div class="mission-badge">
        <div class="badge-ring badge-ring-outer"></div>
        <div class="badge-ring badge-ring-middle"></div>
        <div class="badge-ring badge-ring-inner"></div>
        <div class="badge-content">
          <div class="badge-header">
            <svg viewBox="0 0 24 24" fill="currentColor" class="badge-icon">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div class="badge-title">HOGGCOUNTRY</div>
          <div class="badge-subtitle">CERTIFIED THRU-HIKER</div>
          <div class="badge-divider"></div>
          <div class="badge-hiker">JIMMY HOGG</div>
          <div class="badge-mission-text">NOBO EXPEDITION</div>
          <div class="badge-footer">
            <span>FEB 2026</span>
            <span class="badge-dot"></span>
            <span>GA TO ME</span>
          </div>
        </div>
      </div>

      <!-- Mission Details & Credentials -->
      <div class="mission-details">
        <div class="mission-seal">
          <span class="seal-text">OFFICIAL TRAIL GUIDE</span>
        </div>
        <h2 class="mission-heading">The Expedition Ahead</h2>
        <p class="mission-text">
          In February 2026, Jimmy "HoggCountry" Hogg commences his northbound expedition of the Appalachian Trail.
          A distinguished Arkansas trail veteran and holder of multiple certifications, he has prepared
          this comprehensive handbook to assist fellow hikers in reaching the summit of Mt. Katahdin.
        </p>

        <!-- Vintage Credentials Certificates -->
        <div class="credentials-panel">
          <div class="credentials-header">
            <span class="credentials-label">OFFICIAL CERTIFICATIONS</span>
          </div>

          <div class="mission-credentials">
            <div class="credential credential-featured">
              <span class="credential-badge">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </span>
              <div class="credential-info">
                <span class="credential-title">840+ Trail Miles Certified</span>
                <span class="credential-subtitle">Verified Distance Record</span>
              </div>
            </div>

            <div class="credential credential-award">
              <span class="credential-badge">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </span>
              <div class="credential-info">
                <span class="credential-title">Sassafras Award Recipient</span>
                <span class="credential-subtitle">6th in History to Receive</span>
              </div>
            </div>

            <div class="credential credential-trails">
              <span class="credential-badge">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </span>
              <div class="credential-info">
                <span class="credential-title">Triple "O" Crowner</span>
                <span class="credential-subtitle">Ouachita - Ozark Highlands - Ozark</span>
              </div>
            </div>

            <div class="credential credential-at">
              <span class="credential-badge">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" fill="none" stroke="currentColor" stroke-width="2" />
                </svg>
              </span>
              <div class="credential-info">
                <span class="credential-title">AT Experience: 49 Miles Logged</span>
                <span class="credential-subtitle">Preliminary Reconnaissance</span>
              </div>
            </div>

            <div class="credential credential-summit">
              <span class="credential-badge">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4 20 L12 4 L20 20 Z" />
                  <circle cx="12" cy="8" r="2" fill="#f5f2e8" />
                </svg>
              </span>
              <div class="credential-info">
                <span class="credential-title">Summit Verified: Pikes Peak</span>
                <span class="credential-subtitle">Elevation 14,115 ft</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ========================================== -->
  <!-- EXPEDITION DETAILS - Vintage Dispatch     -->
  <!-- ========================================== -->
  <section class="ranger-expedition">
    <div class="expedition-container">
      <div class="expedition-header">
        <div class="expedition-seal">
          <svg viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="38" stroke="currentColor" stroke-width="2" />
            <circle cx="40" cy="40" r="32" stroke="currentColor" stroke-width="1" stroke-dasharray="4 2" />
            <path d="M40 15 L45 30 L60 30 L48 40 L52 55 L40 45 L28 55 L32 40 L20 30 L35 30 Z" fill="currentColor" />
          </svg>
        </div>
        <h2 class="expedition-title">EXPEDITION DISPATCH</h2>
        <p class="expedition-subtitle">Official Mission Parameters</p>
      </div>

      <div class="expedition-grid">
        <div class="expedition-card">
          <div class="card-stamp">DEPARTURE</div>
          <div class="card-value">February 2026</div>
          <div class="card-label">Commencement Date</div>
        </div>

        <div class="expedition-card">
          <div class="card-stamp">DISTANCE</div>
          <div class="card-value">2,194</div>
          <div class="card-label">Total Trail Miles</div>
        </div>

        <div class="expedition-card">
          <div class="card-stamp">DIRECTION</div>
          <div class="card-value">NOBO</div>
          <div class="card-label">Northbound Traverse</div>
        </div>

        <div class="expedition-card">
          <div class="card-stamp">TERMINUS</div>
          <div class="card-value">Springer to Katahdin</div>
          <div class="card-label">Georgia to Maine</div>
        </div>
      </div>

      <div class="expedition-footer">
        <p class="footer-notice">
          This guide has been field-tested and approved for distribution to all aspiring thru-hikers.
        </p>
        <p class="footer-prepared">
          Prepared by C. Hogg for J. "HoggCountry" Hogg
        </p>
      </div>
    </div>
  </section>

  <!-- ========================================== -->
  <!-- TRAIL TOOLS - Vintage Instrument Panel    -->
  <!-- ========================================== -->
  <section class="ranger-tools">
    <div class="tools-container">
      <div class="tools-header">
        <div class="tools-seal">
          <svg viewBox="0 0 60 60" fill="currentColor">
            <circle cx="30" cy="30" r="28" fill="none" stroke="currentColor" stroke-width="2" />
            <circle cx="30" cy="30" r="22" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="3 2" />
            <circle cx="30" cy="30" r="8" />
            <path d="M30 10v8M30 42v8M10 30h8M42 30h8" stroke="currentColor" stroke-width="2" />
          </svg>
        </div>
        <span class="tools-label">INTERACTIVE PLANNING</span>
        <h2 class="tools-title">TRAIL INSTRUMENTS</h2>
        <p class="tools-subtitle">14 precision calculators to prepare your expedition</p>
      </div>

      <div class="tools-grid">
        <a href="/tools#milestone" class="tool-card">
          <div class="tool-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="10" r="3"/>
              <path d="M12 2a8 8 0 00-8 8c0 5.4 8 12 8 12s8-6.6 8-12a8 8 0 00-8-8z"/>
            </svg>
          </div>
          <span class="tool-name">Milestone Calculator</span>
          <span class="tool-desc">Track daily progress</span>
        </a>

        <a href="/tools#resupply" class="tool-card">
          <div class="tool-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
          </div>
          <span class="tool-name">Resupply Planner</span>
          <span class="tool-desc">Plan town stops</span>
        </a>

        <a href="/tools#weather" class="tool-card">
          <div class="tool-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2"/>
              <circle cx="12" cy="12" r="4"/>
            </svg>
          </div>
          <span class="tool-name">Weather Assessor</span>
          <span class="tool-desc">Evaluate conditions</span>
        </a>

        <a href="/tools#budget" class="tool-card">
          <div class="tool-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
            </svg>
          </div>
          <span class="tool-name">Budget Calculator</span>
          <span class="tool-desc">Estimate total cost</span>
        </a>

        <a href="/tools#pack" class="tool-card">
          <div class="tool-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="4" y="4" width="16" height="18" rx="2"/>
              <path d="M8 2v4M16 2v4"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
          </div>
          <span class="tool-name">Pack Builder</span>
          <span class="tool-desc">Optimize base weight</span>
        </a>

        <a href="/tools#food" class="tool-card">
          <div class="tool-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8h1a4 4 0 010 8h-1"/>
              <path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/>
              <line x1="6" y1="1" x2="6" y2="4"/>
              <line x1="10" y1="1" x2="10" y2="4"/>
              <line x1="14" y1="1" x2="14" y2="4"/>
            </svg>
          </div>
          <span class="tool-name">Food Calculator</span>
          <span class="tool-desc">Plan daily calories</span>
        </a>

        <a href="/tools#water" class="tool-card">
          <div class="tool-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/>
            </svg>
          </div>
          <span class="tool-name">Water Tracker</span>
          <span class="tool-desc">Source management</span>
        </a>

        <a href="/tools#layers" class="tool-card">
          <div class="tool-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span class="tool-name">Layering Advisor</span>
          <span class="tool-desc">Dial in clothing</span>
        </a>

        <a href="/tools#shelter" class="tool-card">
          <div class="tool-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 18l9-9 9 9"/>
              <path d="M5 21h14"/>
            </svg>
          </div>
          <span class="tool-name">Shelter Decider</span>
          <span class="tool-desc">Tent vs hammock</span>
        </a>

        <a href="/tools#power" class="tool-card">
          <div class="tool-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
          </div>
          <span class="tool-name">Power Manager</span>
          <span class="tool-desc">Electronics strategy</span>
        </a>

        <a href="/tools#mail" class="tool-card">
          <div class="tool-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 12h-6l-2 3h-4l-2-3H2"/>
              <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/>
            </svg>
          </div>
          <span class="tool-name">Mail Drop Planner</span>
          <span class="tool-desc">Ship-ahead logistics</span>
        </a>

        <a href="/tools#training" class="tool-card">
          <div class="tool-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <span class="tool-name">Training Planner</span>
          <span class="tool-desc">Build fitness</span>
        </a>

        <a href="/tools#geartrans" class="tool-card">
          <div class="tool-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 1l4 4-4 4"/>
              <path d="M3 11V9a4 4 0 014-4h14"/>
              <path d="M7 23l-4-4 4-4"/>
              <path d="M21 13v2a4 4 0 01-4 4H3"/>
            </svg>
          </div>
          <span class="tool-name">Gear Swap</span>
          <span class="tool-desc">Transition planner</span>
        </a>

        <a href="/tools#emergency" class="tool-card">
          <div class="tool-icon emergency">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <span class="tool-name">Emergency Card</span>
          <span class="tool-desc">Bailout info</span>
        </a>
      </div>

      <div class="tools-footer">
        <a href="/tools" class="tools-cta">
          <span>Open All Instruments</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </a>
      </div>
    </div>
  </section>

  <!-- ========================================== -->
  <!-- TRAIL DISPATCHES - Latest Videos          -->
  <!-- ========================================== -->
  <section class="ranger-dispatches">
    <div class="dispatches-container">
      <div class="dispatches-header">
        <div class="dispatches-stamp">
          <span class="stamp-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </span>
        </div>
        <span class="dispatches-label">MOVING PICTURES</span>
        <h2 class="dispatches-title">TRAIL DISPATCHES</h2>
        <p class="dispatches-subtitle">Field reports and preparations from the expedition</p>
      </div>

      <div class="dispatches-grid">
        <a href="/videos" class="dispatch-card dispatch-featured">
          <div class="dispatch-media">
            <div class="media-placeholder">
              <svg viewBox="0 0 48 48" fill="currentColor">
                <path d="M20 14v20l14-10-14-10z"/>
              </svg>
            </div>
            <span class="dispatch-badge">LATEST</span>
            <span class="dispatch-duration">12:34</span>
          </div>
          <div class="dispatch-content">
            <time class="dispatch-date">December 2025</time>
            <h3 class="dispatch-title">Final Gear Shakedown: The Complete Kit</h3>
            <p class="dispatch-desc">After 840+ miles of testing, the definitive gear list for Springer Mountain.</p>
            <span class="dispatch-cta">View Dispatch</span>
          </div>
        </a>

        <a href="/videos" class="dispatch-card">
          <div class="dispatch-media small">
            <div class="media-placeholder">
              <svg viewBox="0 0 48 48" fill="currentColor">
                <path d="M20 14v20l14-10-14-10z"/>
              </svg>
            </div>
            <span class="dispatch-duration">8:45</span>
          </div>
          <div class="dispatch-content">
            <time class="dispatch-date">November 2025</time>
            <h3 class="dispatch-title">Ozark Training: Winter Conditions Test</h3>
            <span class="dispatch-cta">View Dispatch</span>
          </div>
        </a>

        <a href="/videos" class="dispatch-card">
          <div class="dispatch-media small">
            <div class="media-placeholder">
              <svg viewBox="0 0 48 48" fill="currentColor">
                <path d="M20 14v20l14-10-14-10z"/>
              </svg>
            </div>
            <span class="dispatch-duration">15:22</span>
          </div>
          <div class="dispatch-content">
            <time class="dispatch-date">October 2025</time>
            <h3 class="dispatch-title">Sleep System Deep Dive</h3>
            <span class="dispatch-cta">View Dispatch</span>
          </div>
        </a>
      </div>

      <div class="dispatches-footer">
        <a href="/videos" class="dispatches-cta">
          <span>View All Dispatches</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </a>
      </div>
    </div>
  </section>

  <!-- ========================================== -->
  <!-- THREE PANELS - Vintage Trail Sign Style   -->
  <!-- ========================================== -->
  <section class="ranger-panels">
    <div class="panels-header">
      <div class="header-ornament header-ornament-left">
        <svg viewBox="0 0 60 20">
          <path d="M0 10 L20 10 M25 5 L30 10 L25 15 M35 10 L60 10" stroke="currentColor" stroke-width="2" fill="none" />
        </svg>
      </div>
      <h2 class="panels-title">RANGER RESOURCES</h2>
      <div class="header-ornament header-ornament-right">
        <svg viewBox="0 0 60 20">
          <path d="M0 10 L25 10 M30 5 L35 10 L30 15 M40 10 L60 10" stroke="currentColor" stroke-width="2" fill="none" />
        </svg>
      </div>
    </div>

    <div class="panels-grid">
      <!-- Panel 1: The Guide -->
      <a href="/guide" class="panel panel-guide">
        <div class="panel-frame">
          <div class="panel-number">I</div>
          <div class="panel-icon">
            <svg viewBox="0 0 64 64" fill="currentColor">
              <path d="M8 8h40v48H8z" fill="none" stroke="currentColor" stroke-width="3" />
              <path d="M16 20h24M16 28h24M16 36h16" stroke="currentColor" stroke-width="2" />
              <path d="M48 16l8-8v48l-8 8" fill="none" stroke="currentColor" stroke-width="3" />
            </svg>
          </div>
          <h3 class="panel-title">THE FIELD GUIDE</h3>
          <p class="panel-desc">
            18 chapters of trail-tested wisdom covering gear, resupply, weather patterns,
            and the mental fortitude required for thru-hiking.
          </p>
          <div class="panel-meta">
            <span class="meta-item">
              <svg viewBox="0 0 24 24" fill="currentColor" class="meta-icon">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              18 Chapters
            </span>
            <span class="meta-item">
              <svg viewBox="0 0 24 24" fill="currentColor" class="meta-icon">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
              </svg>
              5 Quick Cards
            </span>
          </div>
          <span class="panel-cta">Commence Reading</span>
        </div>
        <div class="panel-wood-edge"></div>
      </a>

      <!-- Panel 2: The Tools -->
      <a href="/tools" class="panel panel-tools">
        <div class="panel-frame">
          <div class="panel-number">II</div>
          <div class="panel-icon">
            <svg viewBox="0 0 64 64" fill="currentColor">
              <circle cx="32" cy="32" r="24" fill="none" stroke="currentColor" stroke-width="3" />
              <circle cx="32" cy="32" r="8" fill="none" stroke="currentColor" stroke-width="2" />
              <path d="M32 8v8M32 48v8M8 32h8M48 32h8M14 14l6 6M44 44l6 6M14 50l6-6M44 14l6 6" stroke="currentColor" stroke-width="2" />
            </svg>
          </div>
          <h3 class="panel-title">TRAIL INSTRUMENTS</h3>
          <p class="panel-desc">
            14 interactive calculators and planners for milestones, resupply strategy,
            weather decisions, and expedition budget tracking.
          </p>
          <div class="panel-meta">
            <span class="meta-item">
              <svg viewBox="0 0 24 24" fill="currentColor" class="meta-icon">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24" />
              </svg>
              14 Instruments
            </span>
            <span class="meta-item">
              <svg viewBox="0 0 24 24" fill="currentColor" class="meta-icon">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              Real-time Data
            </span>
          </div>
          <span class="panel-cta">Open Toolkit</span>
        </div>
        <div class="panel-wood-edge"></div>
      </a>

      <!-- Panel 3: The Journey -->
      <a href="/trips" class="panel panel-journey">
        <div class="panel-frame">
          <div class="panel-number">III</div>
          <div class="panel-icon">
            <svg viewBox="0 0 64 64" fill="currentColor">
              <path d="M8 56 L24 24 L32 40 L44 16 L56 56" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" />
              <circle cx="16" cy="16" r="8" fill="none" stroke="currentColor" stroke-width="2" />
              <path d="M8 56h48" stroke="currentColor" stroke-width="3" />
            </svg>
          </div>
          <h3 class="panel-title">THE JOURNEY</h3>
          <p class="panel-desc">
            Training expeditions, field reports, and moving picture logs documenting the path from
            Arkansas trails to the AT's white blazes.
          </p>
          <div class="panel-meta">
            <span class="meta-item">
              <svg viewBox="0 0 24 24" fill="currentColor" class="meta-icon">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
              Videos
            </span>
            <span class="meta-item">
              <svg viewBox="0 0 24 24" fill="currentColor" class="meta-icon">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              Field Reports
            </span>
          </div>
          <span class="panel-cta">Follow Along</span>
        </div>
        <div class="panel-wood-edge"></div>
      </a>
    </div>
  </section>

  <!-- ========================================== -->
  <!-- TRAIL FACTS - Vintage Infographic Style   -->
  <!-- ========================================== -->
  <section class="ranger-facts">
    <div class="facts-container">
      <div class="facts-header">
        <h2 class="facts-title">BY THE NUMBERS</h2>
        <p class="facts-subtitle">The Appalachian Trail at a Glance</p>
      </div>

      <div class="facts-grid">
        <div class="fact-card">
          <div class="fact-frame">
            <div class="fact-icon">
              <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 44 L16 20 L24 32 L36 8 L44 44" stroke-linejoin="round" />
                <path d="M4 44h40" />
              </svg>
            </div>
            <div class="fact-number">2,194</div>
            <div class="fact-label">TRAIL MILES</div>
            <div class="fact-detail">Springer to Katahdin</div>
          </div>
        </div>

        <div class="fact-card">
          <div class="fact-frame">
            <div class="fact-icon">
              <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M24 4v40M4 24h40" />
                <path d="M24 4l8 8h-16l8-8" fill="currentColor" />
                <text x="24" y="38" text-anchor="middle" font-size="8" fill="currentColor">ft</text>
              </svg>
            </div>
            <div class="fact-number">464K</div>
            <div class="fact-label">ELEVATION GAIN</div>
            <div class="fact-detail">Total feet climbed</div>
          </div>
        </div>

        <div class="fact-card">
          <div class="fact-frame">
            <div class="fact-icon">
              <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="8" y="8" width="32" height="32" rx="4" />
                <path d="M8 16h32M16 8v32" />
                <circle cx="28" cy="28" r="4" fill="currentColor" />
              </svg>
            </div>
            <div class="fact-number">14</div>
            <div class="fact-label">STATES</div>
            <div class="fact-detail">Georgia to Maine</div>
          </div>
        </div>

        <div class="fact-card">
          <div class="fact-frame">
            <div class="fact-icon">
              <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="24" cy="24" r="18" />
                <path d="M24 12v12l8 8" />
              </svg>
            </div>
            <div class="fact-number">5-7</div>
            <div class="fact-label">MONTHS</div>
            <div class="fact-detail">Average thru-hike</div>
          </div>
        </div>

        <div class="fact-card">
          <div class="fact-frame">
            <div class="fact-icon">
              <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 8h8l4 12h-16l4-12z" />
                <path d="M16 20v20l8-6 8 6V20" />
              </svg>
            </div>
            <div class="fact-number">260+</div>
            <div class="fact-label">SHELTERS</div>
            <div class="fact-detail">Along the trail</div>
          </div>
        </div>

        <div class="fact-card">
          <div class="fact-frame">
            <div class="fact-icon">
              <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M24 4l-4 8h8l-4-8z" fill="currentColor" />
                <path d="M24 12v24" />
                <path d="M12 36h24" />
                <path d="M8 44h32" />
              </svg>
            </div>
            <div class="fact-number">1937</div>
            <div class="fact-label">ESTABLISHED</div>
            <div class="fact-detail">First completed</div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ========================================== -->
  <!-- RANGER'S RECOMMENDATION - Bulletin Board  -->
  <!-- ========================================== -->
  <section class="ranger-bulletin">
    <div class="bulletin-container">
      <div class="bulletin-header">
        <div class="bulletin-badge">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
        <h2 class="bulletin-title">RANGER'S RECOMMENDATION</h2>
        <p class="bulletin-subtitle">Essential reading before you commence your expedition</p>
      </div>

      <div class="bulletin-board">
        <div class="board-texture"></div>

        <!-- Featured Item -->
        <div class="bulletin-featured">
          <div class="featured-pin"></div>
          <div class="featured-content">
            <span class="featured-tag">COMMENCE HERE</span>
            <h3 class="featured-title">Part I: Hiker Profile & Experience</h3>
            <p class="featured-desc">
              Trail credentials, completed thru-hikes, and the 840+ miles of experience that prepare
              a hiker for 2,194 miles of the Appalachian Trail.
            </p>
            <a href="/guide#01-hiker-profile-and-experience" class="featured-link">
              Read Chapter
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>

        <!-- Quick Links -->
        <div class="bulletin-notes">
          <a href="/guide#06-gear-system" class="note note-1">
            <div class="note-pin"></div>
            <span class="note-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </span>
            <span class="note-text">Gear System</span>
            <span class="note-chapter">Part VI</span>
          </a>
          <a href="/guide#15-resupply-logistics" class="note note-2">
            <div class="note-pin"></div>
            <span class="note-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              </svg>
            </span>
            <span class="note-text">Resupply Logistics</span>
            <span class="note-chapter">Part XV</span>
          </a>
          <a href="/guide#12-weather-strategy" class="note note-3">
            <div class="note-pin"></div>
            <span class="note-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9" />
                <polyline points="13 11 9 17 15 17 11 23" />
              </svg>
            </span>
            <span class="note-text">Weather Strategy</span>
            <span class="note-chapter">Part XII</span>
          </a>
        </div>

        <!-- Decorative tacks -->
        <div class="board-tack tack-1"></div>
        <div class="board-tack tack-2"></div>
        <div class="board-tack tack-3"></div>
        <div class="board-tack tack-4"></div>
      </div>
    </div>
  </section>

  <!-- ========================================== -->
  <!-- FOOTER - Vintage Style                    -->
  <!-- ========================================== -->
  <footer class="ranger-footer">
    <div class="footer-border">
      <svg viewBox="0 0 1200 20" preserveAspectRatio="none">
        <path d="M0 10 Q300 0 600 10 T1200 10" stroke="currentColor" stroke-width="2" fill="none" />
      </svg>
    </div>

    <div class="footer-content">
      <div class="footer-logo">
        <div class="footer-badge">
          <span class="footer-mountain">
            <svg viewBox="0 0 40 20" fill="currentColor">
              <path d="M0 20 L10 6 L16 12 L24 3 L34 14 L40 20 Z" />
            </svg>
          </span>
          <span class="footer-brand">HOGG COUNTRY</span>
        </div>
        <span class="footer-est">Est. 2024</span>
      </div>

      <div class="footer-nav">
        <a href="/guide">Field Guide</a>
        <span class="footer-dot"></span>
        <a href="/tools">Trail Tools</a>
        <span class="footer-dot"></span>
        <a href="/trips">Trip Reports</a>
        <span class="footer-dot"></span>
        <a href="/videos">Videos</a>
      </div>

      <div class="footer-tagline">
        <p class="tagline-main">See you on Katahdin.</p>
        <p class="tagline-sub">Prepared with care for the trail ahead.</p>
      </div>

      <div class="footer-blaze">
        <div class="blaze-mark"></div>
        <div class="blaze-mark"></div>
      </div>
    </div>

    <div class="footer-bottom">
      <p>Est. 2024 - Prepared with care for the trail ahead</p>
      <p class="footer-credit">Compiled by C. Hogg for J. "HoggCountry" Hogg</p>
    </div>
  </footer>
</div>

<style>
  /* ===== CSS CUSTOM PROPERTIES ===== */
  .ranger-station {
    --cream: #f5f2e8;
    --cream-dark: #e8e5dc;
    --pine: #4d594a;
    --pine-dark: #3a443a;
    --pine-light: #6d7d6a;
    --brown: #8B7355;
    --brown-dark: #5D4E37;
    --brown-light: #a08060;
    --terra: #d97706;
    --terra-dark: #b45309;
    --marker: #f0e000;
    --ink: #2b2f26;
    --muted: #5c665a;
    --gold: #c9a227;
    --gold-dark: #96751a;

    font-family: Lato, system-ui, -apple-system, sans-serif;
    background: transparent;
    color: var(--ink);
    min-height: 100vh;
    overflow-x: hidden;
  }

  /* ===== HEADER STYLES ===== */
  .ranger-header {
    position: sticky;
    top: 0;
    z-index: 100;
    background: linear-gradient(180deg, var(--brown-dark) 0%, var(--pine-dark) 100%);
    border-bottom: 4px solid var(--brown);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  }

  .ranger-header-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0.75rem 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .ranger-logo {
    text-decoration: none;
  }

  .logo-badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .badge-outer {
    width: 48px;
    height: 48px;
    background: var(--cream);
    border: 3px solid var(--marker);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .badge-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    line-height: 1;
  }

  .badge-mountain {
    color: var(--pine);
    width: 28px;
    height: 14px;
  }

  .badge-mountain svg {
    width: 100%;
    height: 100%;
  }

  .badge-text {
    font-family: Oswald, sans-serif;
    font-size: 0.55rem;
    font-weight: 700;
    letter-spacing: 0.15em;
    color: var(--pine-dark);
    margin-top: 1px;
  }

  .badge-text-sub {
    font-family: Oswald, sans-serif;
    font-size: 0.4rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: var(--brown);
  }

  .badge-est {
    font-family: Oswald, sans-serif;
    font-size: 0.6rem;
    font-weight: 600;
    letter-spacing: 0.15em;
    color: var(--cream);
    opacity: 0.8;
  }

  .ranger-nav {
    display: flex;
    gap: 0.25rem;
  }

  .nav-link {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 0.75rem;
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--cream);
    text-decoration: none;
    border: 2px solid transparent;
    border-radius: 4px;
    transition: all 0.2s ease;
  }

  .nav-link:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: var(--marker);
    color: var(--marker);
  }

  .nav-icon {
    width: 16px;
    height: 16px;
    opacity: 0.8;
  }

  .nav-icon svg {
    width: 100%;
    height: 100%;
  }

  .mobile-menu-btn {
    display: none;
    width: 40px;
    height: 40px;
    background: transparent;
    border: 2px solid var(--cream);
    border-radius: 4px;
    color: var(--cream);
    cursor: pointer;
    padding: 8px;
  }

  .mobile-menu-btn svg {
    width: 100%;
    height: 100%;
  }

  /* ===== HERO SECTION ===== */
  .ranger-hero {
    position: relative;
    background: linear-gradient(180deg, var(--pine-dark) 0%, var(--pine) 50%, var(--pine-light) 100%);
    padding: 4rem 1.5rem 8rem;
    overflow: hidden;
    min-height: 500px;
  }

  .hero-border {
    position: absolute;
    inset: 1.5rem;
    border: 3px solid rgba(245, 242, 232, 0.2);
    pointer-events: none;
  }

  .border-corner {
    position: absolute;
    width: 30px;
    height: 30px;
    border: 3px solid var(--marker);
  }

  .border-tl {
    top: -3px;
    left: -3px;
    border-right: none;
    border-bottom: none;
  }

  .border-tr {
    top: -3px;
    right: -3px;
    border-left: none;
    border-bottom: none;
  }

  .border-bl {
    bottom: -3px;
    left: -3px;
    border-right: none;
    border-top: none;
  }

  .border-br {
    bottom: -3px;
    right: -3px;
    border-left: none;
    border-top: none;
  }

  .hero-mountains {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 300px;
    pointer-events: none;
  }

  .hero-mountains svg {
    width: 100%;
    height: 100%;
  }

  .hero-content {
    position: relative;
    z-index: 2;
    max-width: 800px;
    margin: 0 auto;
    text-align: center;
  }

  .hero-stamp {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    padding: 0.5rem 1.25rem;
    border: 3px solid var(--marker);
    background: rgba(240, 224, 0, 0.1);
    transform: rotate(-3deg);
    margin-bottom: 2rem;
  }

  .stamp-text {
    font-family: Oswald, sans-serif;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.25em;
    color: var(--marker);
  }

  .stamp-year {
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--marker);
    line-height: 1.2;
    letter-spacing: 0.1em;
  }

  .hero-title {
    margin: 0 0 1.5rem;
  }

  .title-prefix {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 400;
    letter-spacing: 0.5em;
    color: var(--cream);
    opacity: 0.7;
    margin-bottom: 0.5rem;
  }

  .title-main {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: clamp(2.5rem, 6vw, 4.5rem);
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--cream);
    text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    line-height: 1;
  }

  .title-suffix {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: clamp(1rem, 2.5vw, 1.5rem);
    font-weight: 600;
    letter-spacing: 0.25em;
    color: var(--marker);
    margin-top: 0.75rem;
  }

  .hero-subtitle {
    font-size: 1.1rem;
    color: var(--cream);
    opacity: 0.85;
    margin: 0 0 2rem;
    line-height: 1.6;
  }

  .hero-route {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 2.5rem;
    flex-wrap: wrap;
  }

  .route-start,
  .route-end {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    color: var(--cream);
  }

  .pin-icon {
    width: 18px;
    height: 18px;
    color: var(--terra);
  }

  .route-line {
    width: 80px;
    color: var(--cream);
    opacity: 0.5;
  }

  .route-line svg {
    width: 100%;
    height: 20px;
  }

  .hero-cta {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
  }

  .cta-primary,
  .cta-secondary {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.875rem 1.5rem;
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    text-decoration: none;
    border-radius: 4px;
    transition: all 0.2s ease;
  }

  .cta-primary {
    background: var(--marker);
    color: var(--ink);
    border: 2px solid var(--marker);
    box-shadow: 0 4px 12px rgba(240, 224, 0, 0.3);
  }

  .cta-primary:hover {
    background: #e6d600;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(240, 224, 0, 0.4);
  }

  .cta-secondary {
    background: transparent;
    color: var(--cream);
    border: 2px solid var(--cream);
  }

  .cta-secondary:hover {
    background: var(--cream);
    color: var(--pine-dark);
  }

  .cta-icon {
    width: 18px;
    height: 18px;
  }

  .cta-icon svg {
    width: 100%;
    height: 100%;
  }

  .hero-blazes {
    position: absolute;
    right: 5%;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .hero-blazes .blaze {
    width: 24px;
    height: 42px;
    background: var(--marker);
    border-radius: 3px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  .blaze-1 {
    transform: rotate(-5deg);
    opacity: 0.9;
  }

  .blaze-2 {
    transform: rotate(3deg);
    opacity: 0.7;
  }

  /* ===== MISSION BADGE SECTION ===== */
  .ranger-mission {
    padding: 5rem 1.5rem;
    position: relative;
  }

  .ranger-mission::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 100px;
    background: linear-gradient(180deg, var(--pine-light) 0%, transparent 100%);
    opacity: 0.1;
  }

  .mission-container {
    max-width: 1100px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 4rem;
    align-items: start;
  }

  .mission-badge {
    position: relative;
    width: 240px;
    height: 240px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .badge-ring {
    position: absolute;
    border-radius: 50%;
    border: 3px solid;
  }

  .badge-ring-outer {
    width: 100%;
    height: 100%;
    border-color: var(--pine);
  }

  .badge-ring-middle {
    width: 90%;
    height: 90%;
    border-color: var(--brown);
    border-style: dashed;
  }

  .badge-ring-inner {
    width: 80%;
    height: 80%;
    border-color: var(--terra);
  }

  .badge-content {
    text-align: center;
    padding: 1rem;
  }

  .badge-header {
    margin-bottom: 0.5rem;
  }

  .badge-icon {
    width: 28px;
    height: 28px;
    color: var(--terra);
  }

  .badge-title {
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: var(--pine-dark);
    line-height: 1;
  }

  .badge-subtitle {
    font-family: Oswald, sans-serif;
    font-size: 0.55rem;
    font-weight: 600;
    letter-spacing: 0.15em;
    color: var(--brown);
    margin-top: 0.25rem;
  }

  .badge-divider {
    width: 60px;
    height: 2px;
    background: var(--terra);
    margin: 0.75rem auto;
  }

  .badge-hiker {
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    letter-spacing: 0.15em;
    color: var(--ink);
  }

  .badge-mission-text {
    font-family: Oswald, sans-serif;
    font-size: 0.65rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: var(--muted);
    margin-top: 0.25rem;
  }

  .badge-footer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 0.75rem;
    font-family: Oswald, sans-serif;
    font-size: 0.55rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: var(--muted);
  }

  .badge-dot {
    width: 4px;
    height: 4px;
    background: var(--terra);
    border-radius: 50%;
  }

  .mission-details {
    max-width: 600px;
  }

  .mission-seal {
    display: inline-block;
    padding: 0.35rem 1rem;
    border: 2px solid var(--gold);
    background: linear-gradient(180deg, rgba(201, 162, 39, 0.1) 0%, rgba(201, 162, 39, 0.05) 100%);
    margin-bottom: 1rem;
  }

  .seal-text {
    font-family: Oswald, sans-serif;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.25em;
    color: var(--gold-dark);
  }

  .mission-heading {
    font-family: Oswald, sans-serif;
    font-size: 2rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    color: var(--pine-dark);
    margin: 0 0 1rem;
  }

  .mission-text {
    font-size: 1.05rem;
    line-height: 1.8;
    color: var(--muted);
    margin: 0 0 1.5rem;
  }

  /* Credentials Panel - Vintage Certificate Style */
  .credentials-panel {
    background: linear-gradient(180deg, #faf9f5 0%, #f5f2e8 100%);
    border: 3px solid var(--brown);
    border-radius: 4px;
    padding: 1.5rem;
    position: relative;
    box-shadow:
      inset 0 0 0 1px var(--cream-dark),
      0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .credentials-panel::before {
    content: '';
    position: absolute;
    top: 8px;
    left: 8px;
    right: 8px;
    bottom: 8px;
    border: 1px dashed var(--brown-light);
    border-radius: 2px;
    pointer-events: none;
  }

  .credentials-header {
    text-align: center;
    margin-bottom: 1.25rem;
    position: relative;
  }

  .credentials-label {
    font-family: Oswald, sans-serif;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.2em;
    color: var(--brown-dark);
    background: var(--cream);
    padding: 0.25rem 0.75rem;
    border: 1px solid var(--brown);
  }

  .mission-credentials {
    display: flex;
    flex-direction: column;
    gap: 0.875rem;
  }

  .credential {
    display: flex;
    align-items: center;
    gap: 0.875rem;
    padding: 0.75rem 1rem;
    background: var(--cream);
    border: 2px solid var(--cream-dark);
    border-radius: 4px;
    transition: all 0.2s ease;
  }

  .credential:hover {
    border-color: var(--terra);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .credential-badge {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--gold) 0%, var(--gold-dark) 100%);
    border-radius: 50%;
    color: var(--cream);
    flex-shrink: 0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  }

  .credential-badge svg {
    width: 18px;
    height: 18px;
  }

  .credential-featured .credential-badge {
    background: linear-gradient(135deg, var(--terra) 0%, var(--terra-dark) 100%);
  }

  .credential-award .credential-badge {
    background: linear-gradient(135deg, #e74c3c 0%, #a93226 100%);
  }

  .credential-info {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .credential-title {
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    letter-spacing: 0.03em;
    color: var(--pine-dark);
  }

  .credential-subtitle {
    font-family: Lato, sans-serif;
    font-size: 0.75rem;
    color: var(--muted);
    font-style: italic;
  }

  /* ===== EXPEDITION DISPATCH SECTION ===== */
  .ranger-expedition {
    background: linear-gradient(180deg, var(--cream) 0%, var(--cream-dark) 50%, var(--cream) 100%);
    padding: 4rem 1.5rem;
    position: relative;
  }

  .ranger-expedition::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: repeating-linear-gradient(
      90deg,
      var(--brown) 0px,
      var(--brown) 30px,
      transparent 30px,
      transparent 40px
    );
  }

  .expedition-container {
    max-width: 900px;
    margin: 0 auto;
    text-align: center;
  }

  .expedition-header {
    margin-bottom: 2.5rem;
  }

  .expedition-seal {
    width: 80px;
    height: 80px;
    margin: 0 auto 1.5rem;
    color: var(--gold);
  }

  .expedition-seal svg {
    width: 100%;
    height: 100%;
  }

  .expedition-title {
    font-family: Oswald, sans-serif;
    font-size: 2rem;
    font-weight: 700;
    letter-spacing: 0.15em;
    color: var(--pine-dark);
    margin: 0 0 0.5rem;
  }

  .expedition-subtitle {
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: var(--muted);
    margin: 0;
  }

  .expedition-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1.5rem;
    margin-bottom: 2.5rem;
  }

  .expedition-card {
    background: var(--cream);
    border: 3px solid var(--brown);
    border-radius: 4px;
    padding: 1.5rem 1rem;
    position: relative;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .expedition-card::before {
    content: '';
    position: absolute;
    top: 4px;
    left: 4px;
    right: 4px;
    bottom: 4px;
    border: 1px solid var(--cream-dark);
    border-radius: 2px;
    pointer-events: none;
  }

  .card-stamp {
    font-family: Oswald, sans-serif;
    font-size: 0.6rem;
    font-weight: 700;
    letter-spacing: 0.2em;
    color: var(--cream);
    background: var(--brown);
    padding: 0.2rem 0.5rem;
    display: inline-block;
    margin-bottom: 0.75rem;
  }

  .card-value {
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--pine-dark);
    line-height: 1.2;
    margin-bottom: 0.25rem;
  }

  .card-label {
    font-family: Lato, sans-serif;
    font-size: 0.75rem;
    color: var(--muted);
  }

  .expedition-footer {
    padding-top: 1.5rem;
    border-top: 2px dashed var(--brown-light);
  }

  .footer-notice {
    font-family: Lato, sans-serif;
    font-size: 0.95rem;
    font-style: italic;
    color: var(--muted);
    margin: 0 0 0.5rem;
  }

  .footer-prepared {
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: var(--brown);
    margin: 0;
  }

  /* ===== TRAIL TOOLS SECTION ===== */
  .ranger-tools {
    background: var(--pine-dark);
    padding: 4rem 1.5rem;
    position: relative;
  }

  .ranger-tools::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: repeating-linear-gradient(
      90deg,
      var(--marker) 0px,
      var(--marker) 15px,
      transparent 15px,
      transparent 30px
    );
  }

  .tools-container {
    max-width: 1100px;
    margin: 0 auto;
  }

  .tools-header {
    text-align: center;
    margin-bottom: 2.5rem;
  }

  .tools-seal {
    width: 60px;
    height: 60px;
    margin: 0 auto 1rem;
    color: var(--marker);
  }

  .tools-seal svg {
    width: 100%;
    height: 100%;
  }

  .tools-label {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.2em;
    color: var(--marker);
    margin-bottom: 0.5rem;
  }

  .tools-title {
    font-family: Oswald, sans-serif;
    font-size: 2rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: var(--cream);
    margin: 0 0 0.5rem;
  }

  .tools-subtitle {
    font-size: 1rem;
    color: var(--cream);
    opacity: 0.7;
    margin: 0;
  }

  .tools-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .tool-card {
    background: rgba(245, 242, 232, 0.08);
    border: 2px solid rgba(245, 242, 232, 0.15);
    border-radius: 8px;
    padding: 1.25rem 0.75rem;
    text-align: center;
    text-decoration: none;
    transition: all 0.25s ease;
  }

  .tool-card:hover {
    background: rgba(245, 242, 232, 0.12);
    border-color: var(--marker);
    transform: translateY(-4px);
  }

  .tool-icon {
    width: 36px;
    height: 36px;
    margin: 0 auto 0.75rem;
    color: var(--marker);
    opacity: 0.9;
  }

  .tool-icon svg {
    width: 100%;
    height: 100%;
  }

  .tool-icon.emergency {
    color: #ef4444;
  }

  .tool-name {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.03em;
    color: var(--cream);
    margin-bottom: 0.25rem;
  }

  .tool-desc {
    display: block;
    font-size: 0.7rem;
    color: var(--cream);
    opacity: 0.5;
  }

  .tools-footer {
    text-align: center;
  }

  .tools-cta {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.875rem 1.75rem;
    background: var(--marker);
    color: var(--ink);
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    text-decoration: none;
    border-radius: 4px;
    transition: all 0.2s ease;
  }

  .tools-cta:hover {
    background: #e6d600;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(240, 224, 0, 0.3);
  }

  .tools-cta svg {
    width: 18px;
    height: 18px;
  }

  /* ===== TRAIL DISPATCHES (VIDEOS) SECTION ===== */
  .ranger-dispatches {
    padding: 4rem 1.5rem;
    position: relative;
  }

  .ranger-dispatches::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: repeating-linear-gradient(
      90deg,
      var(--terra) 0px,
      var(--terra) 20px,
      transparent 20px,
      transparent 40px
    );
  }

  .dispatches-container {
    max-width: 1000px;
    margin: 0 auto;
  }

  .dispatches-header {
    text-align: center;
    margin-bottom: 2.5rem;
  }

  .dispatches-stamp {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    background: var(--terra);
    border-radius: 50%;
    margin-bottom: 1rem;
  }

  .stamp-icon {
    width: 28px;
    height: 28px;
    color: var(--cream);
  }

  .stamp-icon svg {
    width: 100%;
    height: 100%;
  }

  .dispatches-label {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.2em;
    color: var(--terra);
    margin-bottom: 0.5rem;
  }

  .dispatches-title {
    font-family: Oswald, sans-serif;
    font-size: 2rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: var(--pine-dark);
    margin: 0 0 0.5rem;
  }

  .dispatches-subtitle {
    font-size: 1rem;
    color: var(--muted);
    margin: 0;
  }

  .dispatches-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .dispatch-card {
    background: var(--cream);
    border: 3px solid var(--brown);
    border-radius: 6px;
    overflow: hidden;
    text-decoration: none;
    transition: all 0.25s ease;
  }

  .dispatch-card:hover {
    border-color: var(--terra);
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }

  .dispatch-card.dispatch-featured {
    grid-column: 1;
    grid-row: span 2;
  }

  .dispatch-media {
    position: relative;
    height: 200px;
    background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%);
  }

  .dispatch-media.small {
    height: 100px;
  }

  .dispatch-media .media-placeholder {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.8);
  }

  .dispatch-media .media-placeholder svg {
    width: 48px;
    height: 48px;
  }

  .dispatch-media.small .media-placeholder svg {
    width: 32px;
    height: 32px;
  }

  .dispatch-badge {
    position: absolute;
    top: 0.75rem;
    left: 0.75rem;
    background: var(--marker);
    color: var(--ink);
    padding: 0.25rem 0.5rem;
    border-radius: 3px;
    font-family: Oswald, sans-serif;
    font-size: 0.6rem;
    font-weight: 700;
    letter-spacing: 0.1em;
  }

  .dispatch-duration {
    position: absolute;
    bottom: 0.75rem;
    right: 0.75rem;
    background: rgba(0, 0, 0, 0.7);
    color: #fff;
    padding: 0.2rem 0.5rem;
    border-radius: 3px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .dispatch-content {
    padding: 1.25rem;
  }

  .dispatch-date {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.15em;
    color: var(--terra);
    margin-bottom: 0.5rem;
    text-transform: uppercase;
  }

  .dispatch-title {
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--pine-dark);
    margin: 0 0 0.5rem;
    line-height: 1.3;
  }

  .dispatch-featured .dispatch-title {
    font-size: 1.35rem;
  }

  .dispatch-desc {
    font-size: 0.9rem;
    color: var(--muted);
    line-height: 1.5;
    margin: 0 0 1rem;
  }

  .dispatch-cta {
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    color: var(--terra);
    transition: color 0.2s ease;
  }

  .dispatch-card:hover .dispatch-cta {
    color: var(--pine);
  }

  .dispatches-footer {
    text-align: center;
  }

  .dispatches-cta {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.875rem 1.75rem;
    background: var(--terra);
    color: var(--cream);
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    text-decoration: none;
    border-radius: 4px;
    transition: all 0.2s ease;
  }

  .dispatches-cta:hover {
    background: var(--terra-dark);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(217, 119, 6, 0.3);
  }

  .dispatches-cta svg {
    width: 18px;
    height: 18px;
  }

  /* ===== THREE PANELS SECTION ===== */
  .ranger-panels {
    background: linear-gradient(180deg, var(--cream-dark) 0%, var(--cream) 100%);
    padding: 4rem 1.5rem 5rem;
  }

  .panels-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    margin-bottom: 3rem;
  }

  .header-ornament {
    width: 60px;
    color: var(--brown);
  }

  .header-ornament svg {
    width: 100%;
    height: 20px;
  }

  .panels-title {
    font-family: Oswald, sans-serif;
    font-size: 1.75rem;
    font-weight: 700;
    letter-spacing: 0.15em;
    color: var(--pine-dark);
    margin: 0;
  }

  .panels-grid {
    max-width: 1100px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
  }

  .panel {
    position: relative;
    text-decoration: none;
    transition: transform 0.3s ease;
  }

  .panel:hover {
    transform: translateY(-8px);
  }

  .panel-frame {
    background: var(--cream);
    border: 4px solid var(--brown);
    border-radius: 8px;
    padding: 2rem 1.5rem;
    text-align: center;
    position: relative;
    box-shadow:
      0 8px 24px rgba(0, 0, 0, 0.1),
      inset 0 0 0 2px var(--cream-dark);
  }

  .panel:hover .panel-frame {
    border-color: var(--terra);
  }

  .panel-number {
    position: absolute;
    top: -12px;
    left: 50%;
    transform: translateX(-50%);
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--cream);
    background: var(--brown);
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
  }

  .panel:hover .panel-number {
    background: var(--terra);
  }

  .panel-icon {
    width: 64px;
    height: 64px;
    margin: 1rem auto 1.5rem;
    color: var(--pine);
  }

  .panel-icon svg {
    width: 100%;
    height: 100%;
  }

  .panel-title {
    font-family: Oswald, sans-serif;
    font-size: 1.35rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: var(--pine-dark);
    margin: 0 0 1rem;
  }

  .panel-desc {
    font-size: 0.9rem;
    line-height: 1.6;
    color: var(--muted);
    margin: 0 0 1.25rem;
  }

  .panel-meta {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-family: Oswald, sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    color: var(--brown);
  }

  .meta-icon {
    width: 14px;
    height: 14px;
    opacity: 0.7;
  }

  .panel-cta {
    display: inline-block;
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--pine);
    padding: 0.5rem 1rem;
    border: 2px solid var(--pine);
    border-radius: 4px;
    transition: all 0.2s ease;
  }

  .panel:hover .panel-cta {
    background: var(--pine);
    color: var(--cream);
  }

  .panel-wood-edge {
    position: absolute;
    bottom: -8px;
    left: 10%;
    right: 10%;
    height: 8px;
    background: var(--brown-dark);
    border-radius: 0 0 4px 4px;
  }

  /* ===== TRAIL FACTS SECTION ===== */
  .ranger-facts {
    background: var(--pine-dark);
    padding: 4rem 1.5rem;
    position: relative;
  }

  .ranger-facts::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: repeating-linear-gradient(
      90deg,
      var(--marker) 0px,
      var(--marker) 20px,
      transparent 20px,
      transparent 40px
    );
  }

  .facts-container {
    max-width: 1100px;
    margin: 0 auto;
  }

  .facts-header {
    text-align: center;
    margin-bottom: 3rem;
  }

  .facts-title {
    font-family: Oswald, sans-serif;
    font-size: 2rem;
    font-weight: 700;
    letter-spacing: 0.15em;
    color: var(--cream);
    margin: 0 0 0.5rem;
  }

  .facts-subtitle {
    font-size: 1rem;
    color: var(--cream);
    opacity: 0.7;
    margin: 0;
  }

  .facts-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 1.5rem;
  }

  .fact-card {
    text-align: center;
  }

  .fact-frame {
    background: rgba(245, 242, 232, 0.05);
    border: 2px solid rgba(245, 242, 232, 0.2);
    border-radius: 8px;
    padding: 1.5rem 1rem;
    transition: all 0.2s ease;
  }

  .fact-card:hover .fact-frame {
    background: rgba(245, 242, 232, 0.1);
    border-color: var(--marker);
  }

  .fact-icon {
    width: 40px;
    height: 40px;
    margin: 0 auto 1rem;
    color: var(--marker);
    opacity: 0.8;
  }

  .fact-icon svg {
    width: 100%;
    height: 100%;
  }

  .fact-number {
    font-family: Oswald, sans-serif;
    font-size: 2rem;
    font-weight: 700;
    color: var(--cream);
    line-height: 1;
  }

  .fact-label {
    font-family: Oswald, sans-serif;
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.15em;
    color: var(--marker);
    margin-top: 0.5rem;
  }

  .fact-detail {
    font-size: 0.75rem;
    color: var(--cream);
    opacity: 0.5;
    margin-top: 0.25rem;
  }

  /* ===== RANGER'S BULLETIN SECTION ===== */
  .ranger-bulletin {
    padding: 4rem 1.5rem 5rem;
  }

  .bulletin-container {
    max-width: 900px;
    margin: 0 auto;
  }

  .bulletin-header {
    text-align: center;
    margin-bottom: 2.5rem;
  }

  .bulletin-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    background: var(--terra);
    border-radius: 50%;
    color: var(--cream);
    margin-bottom: 1rem;
  }

  .bulletin-badge svg {
    width: 24px;
    height: 24px;
  }

  .bulletin-title {
    font-family: Oswald, sans-serif;
    font-size: 1.75rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: var(--pine-dark);
    margin: 0 0 0.5rem;
  }

  .bulletin-subtitle {
    font-size: 1rem;
    color: var(--muted);
    margin: 0;
  }

  .bulletin-board {
    position: relative;
    background: #c9a66b;
    border: 12px solid var(--brown-dark);
    border-radius: 4px;
    padding: 2.5rem;
    box-shadow:
      inset 0 0 40px rgba(0, 0, 0, 0.2),
      0 10px 30px rgba(0, 0, 0, 0.15);
  }

  .board-texture {
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
    opacity: 0.08;
    pointer-events: none;
  }

  .board-tack {
    position: absolute;
    width: 14px;
    height: 14px;
    background: radial-gradient(circle at 30% 30%, #d4a34d, #8b6914);
    border-radius: 50%;
    box-shadow:
      0 2px 4px rgba(0, 0, 0, 0.3),
      inset 0 -2px 4px rgba(0, 0, 0, 0.2);
  }

  .tack-1 { top: 1rem; left: 1rem; }
  .tack-2 { top: 1rem; right: 1rem; }
  .tack-3 { bottom: 1rem; left: 1rem; }
  .tack-4 { bottom: 1rem; right: 1rem; }

  .bulletin-featured {
    position: relative;
    background: var(--cream);
    padding: 2rem;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: rotate(-1deg);
    margin-bottom: 2rem;
  }

  .featured-pin {
    position: absolute;
    top: -8px;
    left: 50%;
    transform: translateX(-50%);
    width: 20px;
    height: 20px;
    background: radial-gradient(circle at 30% 30%, #e74c3c, #a93226);
    border-radius: 50%;
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
  }

  .featured-content {
    text-align: center;
  }

  .featured-tag {
    display: inline-block;
    font-family: Oswald, sans-serif;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.2em;
    color: var(--cream);
    background: var(--terra);
    padding: 0.25rem 0.75rem;
    border-radius: 3px;
    margin-bottom: 1rem;
  }

  .featured-title {
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--pine-dark);
    margin: 0 0 0.75rem;
  }

  .featured-desc {
    font-size: 0.95rem;
    line-height: 1.6;
    color: var(--muted);
    margin: 0 0 1.25rem;
    max-width: 500px;
    margin-left: auto;
    margin-right: auto;
  }

  .featured-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    color: var(--pine);
    text-decoration: none;
    transition: color 0.2s ease;
  }

  .featured-link:hover {
    color: var(--terra);
  }

  .featured-link svg {
    width: 18px;
    height: 18px;
  }

  .bulletin-notes {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
  }

  .note {
    position: relative;
    background: #fffef5;
    padding: 1rem 1.25rem;
    border-radius: 2px;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.12);
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-width: 180px;
    text-decoration: none;
    transition: all 0.2s ease;
  }

  .note:hover {
    transform: scale(1.05);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.18);
  }

  .note-1 { transform: rotate(2deg); }
  .note-2 { transform: rotate(-1deg); }
  .note-3 { transform: rotate(1.5deg); }

  .note-pin {
    position: absolute;
    top: -6px;
    left: 50%;
    transform: translateX(-50%);
    width: 12px;
    height: 12px;
    background: radial-gradient(circle at 30% 30%, #3498db, #1a5276);
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .note-icon {
    width: 20px;
    height: 20px;
    color: var(--pine);
    opacity: 0.7;
  }

  .note-icon svg {
    width: 100%;
    height: 100%;
  }

  .note-text {
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--ink);
    flex: 1;
  }

  .note-chapter {
    font-family: Oswald, sans-serif;
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--cream);
    background: var(--brown);
    padding: 0.2rem 0.5rem;
    border-radius: 3px;
  }

  /* ===== FOOTER ===== */
  .ranger-footer {
    background: var(--pine-dark);
    position: relative;
  }

  .footer-border {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    color: var(--brown);
  }

  .footer-border svg {
    width: 100%;
    height: 20px;
  }

  .footer-content {
    max-width: 800px;
    margin: 0 auto;
    padding: 4rem 1.5rem 3rem;
    text-align: center;
  }

  .footer-logo {
    margin-bottom: 2rem;
  }

  .footer-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
  }

  .footer-mountain {
    color: var(--marker);
    width: 40px;
    height: 20px;
  }

  .footer-mountain svg {
    width: 100%;
    height: 100%;
  }

  .footer-brand {
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 700;
    letter-spacing: 0.2em;
    color: var(--cream);
  }

  .footer-est {
    font-family: Oswald, sans-serif;
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.15em;
    color: var(--cream);
    opacity: 0.5;
  }

  .footer-nav {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    margin-bottom: 2rem;
    flex-wrap: wrap;
  }

  .footer-nav a {
    font-family: Oswald, sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    color: var(--cream);
    text-decoration: none;
    opacity: 0.7;
    transition: opacity 0.2s ease;
  }

  .footer-nav a:hover {
    opacity: 1;
    color: var(--marker);
  }

  .footer-dot {
    width: 4px;
    height: 4px;
    background: var(--cream);
    border-radius: 50%;
    opacity: 0.3;
  }

  .footer-tagline {
    margin-bottom: 2rem;
  }

  .tagline-main {
    font-family: Caveat, cursive;
    font-size: 1.5rem;
    color: var(--marker);
    margin: 0 0 0.5rem;
  }

  .tagline-sub {
    font-size: 0.85rem;
    color: var(--cream);
    opacity: 0.6;
    margin: 0;
  }

  .footer-blaze {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
  }

  .blaze-mark {
    width: 16px;
    height: 28px;
    background: var(--marker);
    border-radius: 3px;
    opacity: 0.7;
  }

  .blaze-mark:first-child {
    transform: rotate(-5deg);
  }

  .blaze-mark:last-child {
    transform: rotate(5deg);
  }

  .footer-bottom {
    background: rgba(0, 0, 0, 0.2);
    padding: 1rem;
    text-align: center;
  }

  .footer-bottom p {
    font-size: 0.75rem;
    color: var(--cream);
    opacity: 0.5;
    margin: 0;
  }

  .footer-credit {
    font-family: Oswald, sans-serif;
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    color: var(--cream);
    opacity: 0.4;
    margin-top: 0.5rem;
  }

  /* ===== RESPONSIVE STYLES ===== */
  @media (max-width: 1024px) {
    .facts-grid {
      grid-template-columns: repeat(3, 1fr);
    }

    .expedition-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .tools-grid {
      grid-template-columns: repeat(4, 1fr);
    }

    .dispatches-grid {
      grid-template-columns: 1fr;
    }

    .dispatch-card.dispatch-featured {
      grid-row: span 1;
    }
  }

  @media (max-width: 900px) {
    .ranger-nav {
      display: none;
    }

    .mobile-menu-btn {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .mission-container {
      grid-template-columns: 1fr;
      gap: 2.5rem;
      text-align: center;
    }

    .mission-badge {
      margin: 0 auto;
    }

    .mission-details {
      max-width: 100%;
    }

    .mission-credentials {
      align-items: stretch;
    }

    .credential {
      justify-content: center;
    }

    .panels-grid {
      grid-template-columns: 1fr;
      max-width: 400px;
    }

    .panels-header {
      flex-direction: column;
      gap: 0.5rem;
    }

    .header-ornament {
      display: none;
    }
  }

  @media (max-width: 768px) {
    .ranger-hero {
      padding: 3rem 1rem 6rem;
    }

    .hero-border {
      inset: 0.75rem;
    }

    .hero-blazes {
      display: none;
    }

    .hero-route {
      flex-direction: column;
      gap: 0.5rem;
    }

    .route-line {
      transform: rotate(90deg);
      width: 40px;
    }

    .hero-cta {
      flex-direction: column;
      align-items: center;
    }

    .cta-primary,
    .cta-secondary {
      width: 100%;
      max-width: 280px;
      justify-content: center;
    }

    .facts-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .fact-number {
      font-size: 1.5rem;
    }

    .tools-grid {
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
    }

    .tool-name {
      font-size: 0.7rem;
    }

    .tool-desc {
      display: none;
    }

    .dispatch-media {
      height: 160px;
    }

    .bulletin-board {
      padding: 1.5rem;
      border-width: 8px;
    }

    .bulletin-featured {
      padding: 1.5rem;
    }

    .bulletin-notes {
      flex-direction: column;
      align-items: center;
    }

    .note {
      width: 100%;
      max-width: 250px;
    }

    .expedition-grid {
      grid-template-columns: 1fr;
      max-width: 300px;
      margin-left: auto;
      margin-right: auto;
    }
  }

  @media (max-width: 480px) {
    .ranger-header-inner {
      padding: 0.5rem 1rem;
    }

    .badge-outer {
      width: 40px;
      height: 40px;
    }

    .badge-est {
      display: none;
    }

    .hero-stamp {
      padding: 0.35rem 0.75rem;
    }

    .stamp-year {
      font-size: 1rem;
    }

    .title-main {
      font-size: 2rem;
    }

    .mission-badge {
      width: 200px;
      height: 200px;
    }

    .badge-title {
      font-size: 1.25rem;
    }

    .panel-frame {
      padding: 1.5rem 1rem;
    }

    .facts-grid {
      grid-template-columns: 1fr;
    }

    .tools-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .tool-icon {
      width: 28px;
      height: 28px;
    }

    .footer-nav {
      flex-direction: column;
      gap: 0.5rem;
    }

    .footer-dot {
      display: none;
    }
  }
</style>
