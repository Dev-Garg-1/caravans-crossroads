import { Encounter } from '../types';

export const ENCOUNTERS: Record<string, Encounter> = {
  strange_traveler: {
    id: 'strange_traveler',
    title: 'A Lonely Wanderer',
    description: 'A cloaked figure stands by the dusty fork. They look parched and weary.',
    icon: '👤',
    choices: [
      {
        id: 'help_wanderer',
        text: 'Give them food (10 Food)',
        consequenceText: 'The wanderer thanks you deeply. "May the blocks be with you."',
        foodCost: 10,
        reputationGain: 2,
        flagToSet: 'helped_wanderer',
        color: 'bg-emerald-600'
      },
      {
        id: 'scholar_advice',
        text: 'Scholar\'s Counsel',
        consequenceText: 'Your Scholar recognizes the traveler as a disgraced noble. You gain massive renown by treating them with high honor.',
        requiredPassengerType: 'scholar',
        foodCost: 5,
        reputationGain: 15,
        color: 'bg-indigo-600'
      },
      {
        id: 'ignore_wanderer',
        text: 'Keep driving.',
        consequenceText: 'You save your rations but feel a chill in the air.',
        color: 'bg-stone-600'
      }
    ]
  },
  blocky_banker: {
    id: 'blocky_banker',
    title: 'The Blocky Banker',
    description: 'A finely dressed figure sits behind a desk in a mobile office. "Business is booming! Need a loan, or looking to invest your renown?"',
    icon: '💼',
    choices: [
      {
        id: 'reputation_loan',
        text: 'Trade 10 Renown for 100 Gold',
        consequenceText: '"A pleasure doing business. Fame is fleeting, but gold is forever!"',
        reputationCost: 10,
        goldGain: 100,
        color: 'bg-yellow-700'
      },
      {
        id: 'invest_gold',
        text: 'Invest 50 Gold for Renown',
        consequenceText: 'You sponsor a local festival. People will talk about your wealth for miles.',
        goldCost: 50,
        reputationGain: 25,
        color: 'bg-blue-700'
      }
    ]
  },
  cursed_relic: {
    id: 'cursed_relic',
    title: 'The Cursed Relic',
    description: 'An ancient, glowing chest sits abandoned. You feel a strange pull toward its lid.',
    icon: '💀',
    choices: [
      {
        id: 'open_relic',
        text: 'Open the Chest (Gain 250 Gold)',
        consequenceText: 'The chest is overflowing! But a dark cloud follows your caravan. (Cursed: Bandits appear more often)',
        goldGain: 250,
        reputationCost: 30,
        flagToSet: 'cursed_caravan',
        color: 'bg-red-950'
      },
      {
        id: 'leave_relic',
        text: 'Walk away.',
        consequenceText: 'Some treasures are better left buried in the sand.',
        reputationGain: 5,
        color: 'bg-stone-600'
      }
    ]
  },
  ancient_golem: {
    id: 'ancient_golem',
    title: 'The Ancient Golem',
    description: 'A moss-covered stone giant blocks the road. It seems to be missing a core.',
    icon: '🗿',
    choices: [
      {
        id: 'repair_golem',
        text: 'Offer Gold Core (100 Gold)',
        consequenceText: 'The Golem awakens! It clears the path and repairs your caravan with its massive hands.',
        goldCost: 100,
        foodGain: 50,
        reputationGain: 20,
        flagToSet: 'golem_blessing',
        color: 'bg-cyan-700'
      },
      {
        id: 'scholar_golem',
        text: 'Ancient Deciphering',
        consequenceText: 'Your Scholar reads the runes. The Golem steps aside and grants you 1 extra life!',
        requiredPassengerType: 'scholar',
        reputationGain: 10,
        color: 'bg-indigo-600'
      }
    ]
  },
  shady_dealer: {
    id: 'shady_dealer',
    title: 'The Shady Dealer',
    description: 'A grease-stained man whispers from the shadows of his wagon. "I buy anything... even people. You looking to trim your crew for some serious gold?"',
    icon: '🌚',
    choices: [
      {
        id: 'sell_crew',
        text: 'Sell a Crew Member (200 Gold)',
        consequenceText: 'You trade one of your companions for a heavy purse. The road feels emptier, and the guilt heavier.',
        goldGain: 200,
        reputationCost: 50,
        action: 'remove_passenger',
        color: 'bg-red-900'
      },
      {
        id: 'refuse_dealer',
        text: 'Refuse the deal.',
        consequenceText: '"Suit yourself. There are always more caravans."',
        reputationGain: 1,
        color: 'bg-stone-600'
      }
    ]
  },
  traveling_herbalist: {
    id: 'traveling_herbalist',
    title: 'The Herbalist',
    description: 'Vibrant flowers grow directly out of the roof of this colorful wagon. "Need a boost? My elixirs can fill a stomach and sharpen the mind."',
    icon: '🌿',
    choices: [
      {
        id: 'buy_elixir',
        text: 'Buy Vitality Elixir (30 Gold)',
        consequenceText: 'The bitter brew instantly restores your provisions and gives you a new outlook.',
        goldCost: 30,
        foodGain: 100,
        reputationGain: 5,
        color: 'bg-emerald-500'
      },
      {
        id: 'cook_collaboration',
        text: 'Cook\'s Recipe Exchange',
        consequenceText: 'Your Cook shares a secret spice. The Herbalist is so impressed she gives you free samples!',
        requiredPassengerType: 'cook',
        foodGain: 40,
        reputationGain: 10,
        color: 'bg-pink-600'
      }
    ]
  },
  diplomatic_envoy: {
    id: 'diplomatic_envoy',
    title: 'Diplomatic Envoy',
    description: 'A carriage of gold and silk blocks the path. A noble leans out. "My journey is long and my funds are vast, but my reputation in these parts is... lacking. Help me?"',
    icon: '📜',
    choices: [
      {
        id: 'trade_renown',
        text: 'Trade 20 Renown for 150 Gold',
        consequenceText: 'You spend your social capital to fill your coffers. A business decision, purely.',
        reputationCost: 20,
        goldGain: 150,
        color: 'bg-blue-600'
      },
      {
        id: 'honor_envoy',
        text: 'Provide Guard Escort',
        consequenceText: 'Your Guard ensures safe passage through the next fork. The noble pays you well and tells tales of your bravery.',
        requiredPassengerType: 'guard',
        goldGain: 80,
        reputationGain: 10,
        color: 'bg-emerald-700'
      }
    ]
  },
  hungry_merchant: {
    id: 'hungry_merchant',
    title: 'Stranded Merchant',
    description: 'A broken wagon sits by the road. The merchant is desperate for supplies.',
    icon: '🛒',
    choices: [
      {
        id: 'merchant_negotiation',
        text: 'Merchant\'s Haggle',
        consequenceText: 'Your on-board Merchant spots rare spices in the back. You buy the whole lot for a pittance!',
        requiredPassengerType: 'merchant',
        goldCost: 20,
        goldGain: 80,
        color: 'bg-yellow-700'
      },
      {
        id: 'trade_supplies',
        text: 'Sell 15 Food for 45 Gold',
        consequenceText: 'The merchant is relieved. "You saved my livelihood!" You make a profit.',
        foodCost: 15,
        goldGain: 45,
        color: 'bg-amber-600'
      },
      {
        id: 'buy_stock',
        text: 'Buy Bulk Food (30 Gold for 40 Food)',
        consequenceText: 'He sells you his remaining stock at a discount to get home faster.',
        goldCost: 30,
        foodGain: 40,
        color: 'bg-blue-600'
      }
    ]
  },
  bandit_toll: {
    id: 'bandit_toll',
    title: 'The Shadowed Gate',
    description: 'Armed blocky riders block the path. "Toll road," their leader sneers.',
    icon: '⚔️',
    choices: [
      {
        id: 'guard_standoff',
        text: 'Guard\'s Threat',
        consequenceText: 'Your Guard steps forward, hand on their hilt. The bandits back down without a fight.',
        requiredPassengerType: 'guard',
        reputationGain: 5,
        color: 'bg-slate-800'
      },
      {
        id: 'pay_toll',
        text: 'Pay the toll (25 Gold)',
        consequenceText: 'They let you pass with mock salutes.',
        goldCost: 25,
        color: 'bg-red-700'
      }
    ]
  },
  food_cart: {
    id: 'food_cart',
    title: 'Chef Block\'s Mobile Grill',
    description: 'The aroma of grilled mystery meat is intoxicating. "Hungry, traveler?"',
    icon: '🍳',
    choices: [
      {
        id: 'snack',
        text: 'Light Snack (8G -> 15 Food)',
        consequenceText: 'A tasty, quick bite to keep you alert.',
        goldCost: 8,
        foodGain: 15,
        color: 'bg-green-500'
      },
      {
        id: 'platter',
        text: 'Gourmet Feast (30G -> 65 Food)',
        consequenceText: 'A massive spread! Your crew is energized and the road ahead looks shorter.',
        goldCost: 30,
        foodGain: 65,
        color: 'bg-green-700'
      }
    ]
  },
  waystation: {
    id: 'waystation',
    title: 'Border Waystation',
    description: 'A major fortified supply point in the middle of nowhere.',
    icon: '🚩',
    choices: [
      {
        id: 'resupply',
        text: 'Full Resupply (40 Gold)',
        consequenceText: 'You top off all provisions and repair the wagon.',
        goldCost: 40,
        foodGain: 100,
        color: 'bg-cyan-600'
      },
      {
        id: 'help_guards',
        text: 'Donate Supplies (25 Food)',
        consequenceText: 'The guards are thankful. Word of your generosity spreads.',
        foodCost: 25,
        reputationGain: 12,
        color: 'bg-indigo-600'
      }
    ]
  },
  haven_checkpoint: {
    id: 'haven_checkpoint',
    title: 'Eastmere Haven',
    description: 'The golden gates of the Haven loom ahead. A safe place for blocky folk.',
    icon: '🏰',
    choices: [
      {
        id: 'continue_loop',
        text: 'Resupply and Go Further',
        consequenceText: 'You rest for a night and head back into the wilder chunks.',
        action: 'continue_journey',
        foodGain: 50,
        color: 'bg-emerald-500'
      },
      {
        id: 'retire_journey',
        text: 'Settle Down Forever',
        consequenceText: 'Your journey ends here. You buy a small house and watch the caravans go by.',
        action: 'end_journey',
        color: 'bg-amber-400'
      }
    ]
  }
};
