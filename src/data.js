// ============================================================
//  DADOS DO CARDÁPIO — edite preços e itens aqui
//  price: null   →  exibe "Em breve" (botão desabilitado)
//  comingSoon: true  →  badge "Em breve" no card
//  image: '/images/nome.jpg'  →  foto do produto (pasta public/images/)
// ============================================================

// Sabores como strings — usados nos milkshakes
const SHAKE_FLAVORS = [
  'Morango', 'Chocolate', 'Abacaxi', 'Flocos', 'Chocomenta', 'Baunilha',
  'Tentação', 'Ovomaltine', 'Brigadeiro', 'Choco Leite', 'Creme com Passas',
  'Napolitano', 'Iogurte Grego', 'Frutas Cristalizadas', 'Unicórnio',
  'Nata Goiaba', 'Blue Ice', 'Crocante',
];

// Sabores com foto — usados na seção "Monte o Seu"
// Coloque as imagens em public/images/sorvetes/
const SORVETE_LIST = [
  { name: 'Morango',               image: '/images/sorvetes/sorvete-morango.jpg'            },
  { name: 'Chocolate',             image: '/images/sorvetes/sorvete-chocolate.jpg'           },
  { name: 'Abacaxi',               image: '/images/sorvetes/sorvete-abacaxi.jpg'             },
  { name: 'Flocos',                image: '/images/sorvetes/sorvete-flocos.jpg'              },
  { name: 'Chocomenta',            image: '/images/sorvetes/sorvete-chocomenta.jpg'          },
  { name: 'Baunilha',              image: '/images/sorvetes/sorvete-baunilha.jpg'            },
  { name: 'Tentação',              image: '/images/sorvetes/sorvete-tentacao.jpg'            },
  { name: 'Ovomaltine',            image: '/images/sorvetes/sorvete-ovomaltine.jpg'          },
  { name: 'Brigadeiro',            image: '/images/sorvetes/sorvete-brigadeiro.jpg'          },
  { name: 'Choco Leite',           image: '/images/sorvetes/sorvete-chocoleite.jpg'          },
  { name: 'Creme com Passas',      image: '/images/sorvetes/sorvete-creme-com-passas.jpg'   },
  { name: 'Napolitano',            image: '/images/sorvetes/sorvete-napolitano.jpg'          },
  { name: 'Iogurte Grego',         image: '/images/sorvetes/sorvete-iogurte-grego.jpg'      },
  { name: 'Frutas Cristalizadas',  image: '/images/sorvetes/sorvete-frutas-cristalizadas.jpg' },
  { name: 'Unicórnio',             image: '/images/sorvetes/sorvete-unicornio.jpg'           },
  { name: 'Nata Goiaba',           image: '/images/sorvetes/sorvete-nata-goiaba.jpg'        },
  { name: 'Blue Ice',              image: '/images/sorvetes/sorvete-blue-ice.jpg'            },
  { name: 'Crocante',              image: '/images/sorvetes/sorvete-crocante.jpg'            },
];

export const MENU_SECTIONS = [
  // ── 1. Açaí por KG ─────────────────────────────────────
  {
    id: 'acai-kg',
    name: 'Açaí por KG',
    emoji: '🍇',
    type: 'regular',
    products: [
      {
        id: 1,
        name: 'Açaí a Parte (kg)',
        price: 62.00,
        description: 'Açaí puro e cremoso — monte do seu jeito com nossos complementos especiais!',
        image: '/images/acai-kg.jpg',
      },
    ],
  },

  // ── 2. Combos 250ml ────────────────────────────────────
  {
    id: 'combos-250',
    name: 'Combos 250ml',
    emoji: '🥤',
    type: 'regular',
    products: [
      {
        id: 2,
        name: 'Combo Morango M&M',
        price: 15.90,
        description: 'Combinação irresistível de açaí com sabor de morango e M&M.',
        ingredients: ['Açaí', 'Preparado de morango', 'Leite em pó', 'M&M'],
        image: '/images/combo-morango-250ml.jpg',
      },
      {
        id: 3,
        name: 'Combo Creme de Leitinho',
        price: 16.90,
        description: 'Açaí cremoso com creme de leitinho, cereja e leite condensado.',
        ingredients: ['Açaí', 'Creme de leitinho', 'Cereja', 'Leite condensado'],
        image: '/images/combo-leitinho-250ml.jpg',
      },
    ],
  },

  // ── 3. Combos 500ml ────────────────────────────────────
  {
    id: 'combos-500',
    name: 'Combos 500ml',
    emoji: '🍨',
    type: 'regular',
    products: [
      {
        id: 4,
        name: 'Combo Amendoim & Castanha',
        price: 28.90,
        description: 'Açaí com creme de amendoim e castanha — sabor que conquista!',
        ingredients: ['Açaí', 'Creme de amendoim', 'Castanha'],
        image: '/images/combo-amendoim-500ml.jpg',
      },
      {
        id: 5,
        name: 'Combo Creme de Leitinho 500ml',
        price: 29.90,
        description: 'Açaí com creme de leitinho, leite em pó e M&M — puro amor!',
        ingredients: ['Açaí', 'Creme de leitinho', 'Leite em pó', 'M&M'],
        image: '/images/combo-leitinho-500ml.jpg',
      },
      {
        id: 6,
        name: 'Combo Nutella & Gotinha',
        price: 29.90,
        description: 'Açaí com Nutella, gotinha de chocolate e leite em pó.',
        ingredients: ['Açaí', 'Nutella', 'Gotinha de chocolate', 'Leite em pó'],
        image: '/images/combo-nutella-500ml.jpg',
      },
    ],
  },

  // ── 4. Combos 1KG ──────────────────────────────────────
  {
    id: 'combos-1kg',
    name: 'Combos 1KG',
    emoji: '🏆',
    type: 'regular',
    products: [
      {
        id: 7,
        name: 'Combo Amendoim Especial 1KG',
        price: 58.90,
        description: 'O combo completo dos amantes de amendoim — cheio de crocância!',
        ingredients: ['Açaí', 'Creme de amendoim', 'Castanha', 'Paçoca', 'Choco bal', 'Leite condensado'],
        image: '/images/combo-amendoim-1kg.jpg',
      },
      {
        id: 8,
        name: 'Combo Frutas & Chocolate 1KG',
        price: 59.90,
        description: 'A explosão de frutas e chocolate que você precisava!',
        ingredients: ['Açaí', 'Nutella', 'Morango', 'Uva', 'Gotinha de chocolate', 'Cereja', 'Cobertura de chocolate'],
        image: '/images/combo-frutas-1kg.jpg',
      },
    ],
  },

  // ── 5. Monte o Seu (informativo — cobrado por peso) ───────
  {
    id: 'monte-seu',
    name: 'Monte o Seu',
    emoji: '🍦',
    type: 'monte',
    highlight: 'Monte do seu jeito! Escolha os sabores e a quantidade de cada um. Tudo cobrado por peso — R$ 62,00/kg',
    sorvetes: SORVETE_LIST,
    creams: ['Creme de Ninho', 'Creme de Oreo', 'Creme de Pitaia', 'Cupuaçu'],
  },

  // ── 7. Milkshakes ──────────────────────────────────────
  {
    id: 'milkshakes',
    name: 'Milkshakes',
    emoji: '🥛',
    type: 'regular',
    products: [
      {
        id: 9,
        name: 'Milkshake 500ml',
        price: 14.00,
        description: 'Milkshake gelado e cremoso em 500ml. Escolha o seu sabor!',
        flavors: SHAKE_FLAVORS,
        image: '/images/milkshake.jpg',
      },
      {
        id: 10,
        name: 'Milkshake 750ml',
        price: 16.00,
        description: 'Milkshake gelado e cremoso em 750ml — tamanho família! Escolha o sabor.',
        flavors: SHAKE_FLAVORS,
        image: '/images/milkshake.jpg',
      },
    ],
  },

  // ── 8. Outros ──────────────────────────────────────────
  {
    id: 'outros',
    name: 'Outros',
    emoji: '🫙',
    type: 'regular',
    products: [
      {
        id: 11,
        name: 'Açaí na Garrafa',
        price: 20.00,
        description: 'Açaí delicioso em garrafa, perfeito para levar ou presentear!',
        image: '/images/acai-garrafa.jpg',
      },
    ],
  },
];
