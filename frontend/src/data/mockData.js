export const services = [
  {
    id: 'bath-brush',
    name: 'Bath & Brush',
    duration: '45 min',
    price: 35,
    description: 'Hydrating wash, gentle dry, paw cleanup, and coat brushing.',
  },
  {
    id: 'style-trim',
    name: 'Style Trim',
    duration: '75 min',
    price: 58,
    description: 'Breed-aware trim, face shaping, sanitary cut, and finishing spray.',
  },
  {
    id: 'shed-control',
    name: 'Shed Control',
    duration: '60 min',
    price: 49,
    description: 'Deshedding treatment for double-coated companions with coat serum.',
  },
  {
    id: 'spa-reset',
    name: 'Spa Reset',
    duration: '90 min',
    price: 72,
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

export const initialData = {
  users: [
    {
      id: 'user-admin',
      name: 'Ariana Cruz',
      email: 'admin@pawze.app',
      password: 'Admin123!',
      role: 'admin',
      phone: '+63 917 100 2000',
      location: 'Pasig City',
      avatar: '/images/goran-radeski.jpg',
    },
    {
      id: 'user-groomer',
      name: 'Miko Reyes',
      email: 'groomer@pawze.app',
      password: 'Groom123!',
      role: 'groomer',
      phone: '+63 917 300 4000',
      location: 'Mandaluyong',
      avatar: '/images/image-7.jpg',
    },
    {
      id: 'user-customer',
      name: 'Jamie Torres',
      email: 'customer@pawze.app',
      password: 'Customer123!',
      role: 'customer',
      phone: '+63 917 500 6000',
      location: 'Quezon City',
      avatar: '/images/cutest-puppy.jpg',
    },
  ],
  pets: [
    {
      id: 'pet-1',
      ownerId: 'user-customer',
      name: 'Sunny',
      breed: 'Golden Retriever',
      age: '2 years',
      weight: '24 kg',
      notes: 'Loves warm water and peanut-butter treats.',
    },
    {
      id: 'pet-2',
      ownerId: 'user-customer',
      name: 'Rex',
      breed: 'German Shepherd',
      age: '4 years',
      weight: '31 kg',
      notes: 'Sensitive around ears, prefers early appointments.',
    },
  ],
  appointments: [
    {
      id: 'appt-1',
      customerId: 'user-customer',
      customerName: 'Jamie Torres',
      petId: 'pet-1',
      petName: 'Sunny',
      service: 'Spa Reset',
      date: '2026-05-15',
      time: '09:30',
      groomerId: 'user-groomer',
      groomerName: 'Miko Reyes',
      status: 'confirmed',
      notes: 'Use hypoallergenic shampoo.',
    },
    {
      id: 'appt-2',
      customerId: 'user-customer',
      customerName: 'Jamie Torres',
      petId: 'pet-2',
      petName: 'Rex',
      service: 'Shed Control',
      date: '2026-05-18',
      time: '14:00',
      groomerId: 'user-groomer',
      groomerName: 'Miko Reyes',
      status: 'pending',
      notes: 'Double coat deshedding and nail trim.',
    },
  ],
  inventory: [
    {
      id: 'inv-1',
      name: 'Oatmeal Shampoo',
      category: 'Consumable',
      quantity: 5,
      unit: 'bottles',
      threshold: 6,
      supplier: 'FurFresh Supply',
    },
    {
      id: 'inv-2',
      name: 'Finishing Spray',
      category: 'Consumable',
      quantity: 12,
      unit: 'bottles',
      threshold: 5,
      supplier: 'Pet Luxe Co.',
    },
    {
      id: 'inv-3',
      name: 'Nail Grinder Bits',
      category: 'Tools',
      quantity: 3,
      unit: 'sets',
      threshold: 4,
      supplier: 'Clip Craft',
    },
    {
      id: 'inv-4',
      name: 'Bow Ties',
      category: 'Accessories',
      quantity: 18,
      unit: 'packs',
      threshold: 7,
      supplier: 'Tail & Trim',
    },
  ],
}
