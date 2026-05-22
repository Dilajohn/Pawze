/**
 * Static display data for the landing page.
 * These are not application state — they are marketing copy and never sent to the API.
 *
 * NOTE: The old `initialData` block (users / pets / appointments / inventory) has been
 * removed. All live data is now fetched from the Django backend via api.js.
 */

export const services = [
  {
    id: 'bath-brush',
    name: 'Bath & Brush',
    duration: '45 min',
    price: 35000,
    description: 'Hydrating wash, gentle dry, paw cleanup, and coat brushing.',
  },
  {
    id: 'style-trim',
    name: 'Style Trim',
    duration: '75 min',
    price: 58000,
    description: 'Breed-aware trim, face shaping, sanitary cut, and finishing spray.',
  },
  {
    id: 'shed-control',
    name: 'Shed Control',
    duration: '60 min',
    price: 49000,
    description: 'Deshedding treatment for double-coated companions with coat serum.',
  },
  {
    id: 'spa-reset',
    name: 'Spa Reset',
    duration: '90 min',
    price: 72000,
    description: 'Luxury package with blueberry facial, nail care, ear cleaning, and bow.',
  },
]

export const landingStats = [
  { label: 'happy pets groomed', value: '3.2k+' },
  { label: 'average check-in time', value: '4 min' },
  { label: 'repeat bookings', value: '86%' },
  { label: 'inventory visibility', value: '24/7' },
]

export const testimonials = [
  {
    name: 'Nadia & Churro',
    role: 'Monthly member',
    quote:
      'Pawze made booking feel effortless, and the groomer notes helped Churro stay calm every visit.',
  },
  {
    name: 'Marco Dela Cruz',
    role: 'Shop owner',
    quote:
      'The low-stock alerts alone save us. We stopped scrambling for shampoo on busy weekends.',
  },
  {
    name: 'Leila Santos',
    role: 'Lead groomer',
    quote:
      'I can see my day, update statuses fast, and focus on the pets instead of paper lists.',
  },
]

export const howItWorks = [
  {
    step: '01',
    title: 'Choose a service',
    description: 'Customers browse curated grooming packages with transparent durations and prices.',
  },
  {
    step: '02',
    title: 'Match with a slot',
    description: 'Open appointment times update instantly so double-booking pressure disappears.',
  },
  {
    step: '03',
    title: 'Groomers stay in sync',
    description: 'Schedules, pet notes, and service progress move together in one clean workflow.',
  },
  {
    step: '04',
    title: 'Supplies stay ready',
    description: 'Inventory counts and low-stock nudges keep the salon prepared for every visit.',
  },
]

export const dashboardHighlights = [
  {
    title: 'Appointment intelligence',
    body: 'Track bookings, statuses, reminders, and histories without scattered spreadsheets.',
  },
  {
    title: 'Inventory confidence',
    body: 'Monitor consumables and tools with low-stock signals before service quality is affected.',
  },
  {
    title: 'Pet-first records',
    body: 'Keep preferences, coat notes, and prior visits handy for tailored grooming experiences.',
  },
]
