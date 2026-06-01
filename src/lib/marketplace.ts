export const CATEGORIES = [
  { id: 'clothes_women',    label: "Women's Clothes",    emoji: '👗', hasClothesSize: true  },
  { id: 'clothes_men',      label: "Men's Clothes",      emoji: '👔', hasClothesSize: true  },
  { id: 'shoes_women',      label: "Women's Shoes",      emoji: '👠', hasShoesSize:   true  },
  { id: 'shoes_men',        label: "Men's Shoes",        emoji: '👟', hasShoesSize:   true  },
  { id: 'bags_accessories', label: 'Bags & Accessories', emoji: '👜'                        },
  { id: 'electronics',      label: 'Electronics',        emoji: '💻'                        },
  { id: 'furniture',        label: 'Furniture',          emoji: '🛋️'                        },
  { id: 'books_studies',    label: 'Books & Studies',    emoji: '📚'                        },
  { id: 'kitchen_home',     label: 'Kitchen & Home',     emoji: '🍳'                        },
  { id: 'sports_outdoors',  label: 'Sports & Outdoors',  emoji: '⚽'                        },
  { id: 'beauty_health',    label: 'Beauty & Health',    emoji: '💄'                        },
  { id: 'bikes_transport',  label: 'Bikes & Transport',  emoji: '🚲'                        },
  { id: 'tickets_events',   label: 'Tickets & Events',   emoji: '🎟️', isTicket: true        },
  { id: 'games_hobbies',    label: 'Games & Hobbies',    emoji: '🎮'                        },
  { id: 'other',            label: 'Other',              emoji: '📦'                        },
] as const

export const CLOTHES_SIZES = [
  'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL',
  '34', '36', '38', '40', '42', '44', '46', '48',
] as const

export const SHOES_SIZES = [
  '35', '36', '37', '38', '39', '40',
  '41', '42', '43', '44', '45', '46', '47',
] as const

export const CONDITIONS = [
  { id: 'new_with_tags',    label: 'New with tags',    color: '#2ECC71', desc: 'Never worn, original tags' },
  { id: 'new_without_tags', label: 'New without tags', color: '#4ECDC4', desc: 'Never worn, no tags'       },
  { id: 'very_good',        label: 'Very good',        color: '#F5A623', desc: 'Worn a few times'          },
  { id: 'good',             label: 'Good',             color: '#FF6B35', desc: 'Some signs of wear'        },
  { id: 'satisfactory',     label: 'Satisfactory',     color: '#888',    desc: 'Visible signs of wear'     },
] as const

export const NEIGHBORHOODS = [
  'Ruzafa', 'El Carmen', 'Benimaclet', 'Gran Vía', 'Ensanche',
  'Cabanyal', 'Patraix', 'Campanar', 'Malvarrosa', 'Nou Moles',
  'La Saïdia', 'Marxalenes', 'Orriols', 'Mestalla', 'Other',
] as const

export const NATIONALITIES = [
  { code: 'ES',    label: '🇪🇸 Spanish'    },
  { code: 'DE',    label: '🇩🇪 German'     },
  { code: 'FR',    label: '🇫🇷 French'     },
  { code: 'IT',    label: '🇮🇹 Italian'    },
  { code: 'PL',    label: '🇵🇱 Polish'     },
  { code: 'PT',    label: '🇵🇹 Portuguese' },
  { code: 'NL',    label: '🇳🇱 Dutch'      },
  { code: 'BE',    label: '🇧🇪 Belgian'    },
  { code: 'RO',    label: '🇷🇴 Romanian'   },
  { code: 'TR',    label: '🇹🇷 Turkish'    },
  { code: 'GB',    label: '🇬🇧 British'    },
  { code: 'US',    label: '🇺🇸 American'   },
  { code: 'BR',    label: '🇧🇷 Brazilian'  },
  { code: 'MX',    label: '🇲🇽 Mexican'    },
  { code: 'MA',    label: '🇲🇦 Moroccan'   },
  { code: 'Other', label: '🌍 Other'       },
] as const

export type CategoryId  = typeof CATEGORIES[number]['id']
export type ConditionId = typeof CONDITIONS[number]['id']
