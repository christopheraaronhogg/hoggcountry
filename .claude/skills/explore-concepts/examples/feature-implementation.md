# Example: Feature Implementation Flow

Using explore-concepts for architectural decisions and multi-file features.

## User Request

> "Add a notification system for order status updates"

## Phase 1: Context Gathering

```
Reading existing notification patterns...
  - Looking for toast systems...
  - Found: resources/js/components/admin/admin-toast.tsx
  - Found: Laravel Echo/Reverb configuration
Reading related systems...
  - Order model and events
  - User preferences patterns
```

**Extracted Context:**
- AdminToast exists for flash messages
- Reverb WebSocket configured
- Laravel events/listeners pattern available
- User has notification preferences table

## Phase 2: Direction Discovery

This request is architectural - directions differ in approach, not just visuals:

```
Task(
  model: "haiku",
  prompt: "Generate 3 architectural directions for: 'notification system for order status updates'..."
)
```

**3 Directions Generated:**

### 1. Real-Time Push Stream
- **Architecture**: WebSocket-first with Reverb broadcasting
- **Key Traits**:
  - Instant push via Laravel Echo
  - Floating notification bell in header
  - Toast popups for urgent items
  - Persistent dropdown for history
- **Prioritizes**: Immediacy, real-time awareness
- **Sacrifices**: Offline support, battery/bandwidth on mobile

### 2. Polling with Smart Batching
- **Architecture**: Periodic API polling with intelligent grouping
- **Key Traits**:
  - Poll every 30s for new notifications
  - Batch similar notifications ("3 orders shipped")
  - Badge count in nav, full page for details
  - Works offline, syncs on reconnect
- **Prioritizes**: Reliability, simplicity, low server load
- **Sacrifices**: Real-time feel, instant awareness

### 3. Email-First with In-App Summary
- **Architecture**: Email as primary, in-app as secondary
- **Key Traits**:
  - Rich email notifications with action buttons
  - In-app notification center as digest view
  - Daily/weekly summary options
  - Minimal real-time, respects attention
- **Prioritizes**: User attention, email workflow, reduced noise
- **Sacrifices**: In-app engagement, real-time updates

## Phase 3: Parallel Implementation

Each direction requires different files:

### Direction 1 (Real-Time) would create:
```
app/Events/OrderStatusChanged.php
app/Listeners/BroadcastOrderStatus.php
resources/js/components/notifications/NotificationBell.tsx
resources/js/components/notifications/NotificationToast.tsx
resources/js/hooks/use-notifications.ts
```

### Direction 2 (Polling) would create:
```
app/Http/Controllers/NotificationsController.php
resources/js/components/notifications/NotificationBadge.tsx
resources/js/pages/notifications.tsx
resources/js/hooks/use-notification-polling.ts
```

### Direction 3 (Email-First) would create:
```
app/Notifications/OrderStatusNotification.php
app/Mail/OrderStatusDigest.php
resources/js/pages/notification-preferences.tsx
app/Console/Commands/SendNotificationDigests.php
```

**3 Opus agents generate in parallel...**

## Phase 4: Selection

```
I've generated 3 notification system architectures:

**1. Real-Time Push Stream**
WebSocket-powered instant notifications.
- Bell icon in header with dropdown
- Toast popups for urgent items
- Requires Reverb connection
→ 5 new files, uses Laravel Echo

**2. Polling with Smart Batching**
Periodic polling with intelligent grouping.
- Badge in nav, dedicated page for history
- Works offline, batches similar items
- Lower server requirements
→ 4 new files, simple HTTP polling

**3. Email-First with In-App Summary**
Email as primary channel with in-app digest.
- Rich email templates
- Notification preferences page
- Daily/weekly summaries
→ 4 new files, scheduled commands

Which approach fits your needs?
```

User: "Let's go with Real-Time but I want the batching logic from option 2"

## Phase 5: Combined Implementation

```
Creating Real-Time Push with Smart Batching...

This combines:
- WebSocket push for instant delivery
- Client-side batching for grouped display
- Both toast and dropdown interfaces

Writing files:
  ✓ app/Events/OrderStatusChanged.php
  ✓ app/Listeners/BroadcastOrderStatus.php
  ✓ resources/js/components/notifications/NotificationBell.tsx
  ✓ resources/js/components/notifications/NotificationToast.tsx
  ✓ resources/js/hooks/use-notifications.ts
  ✓ resources/js/lib/notification-batcher.ts

Running npm run types... ✓
Running npm run build... ✓
```

## Phase 6: Variation (Optional)

User: "Can you show me different UI treatments for the notification bell?"

```
Generating 3 variations of the notification bell UI...
```

**Variations:**

1. **Minimal Dot Indicator**
   - Just a red dot, no count
   - Dropdown on click

2. **Floating Action Bell**
   - Fixed position bottom-right
   - Animated shake on new notifications
   - Expands to full panel

3. **Header Badge Count**
   - Count badge, traditional placement
   - Slide-down notification panel
   - Sound option for urgent

## Key Insight for Features

For feature requests (vs UI requests), directions should differ on:

| Dimension | Options |
|-----------|---------|
| Architecture | Push vs Pull vs Hybrid |
| Data Flow | Real-time vs Batched vs On-demand |
| Storage | Client-side vs Server-side vs Both |
| Delivery | In-app vs Email vs SMS vs Push |
| Complexity | Simple now vs Extensible later |

The visual treatment is secondary - the architecture choice has bigger impact.
