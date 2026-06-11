import { useState, useCallback, useRef, useEffect } from 'react';
import { MENU_SECTIONS } from './data.js';

// ============================================================
//  CONFIGURAÇÕES EDITÁVEIS
// ============================================================
const WHATSAPP_NUMBER   = '558791993132';          // Número com código do país (sem + ou espaços)
const DELIVERY_FEE_NOTE = 'Taxa de entrega a calcular pelo entregador';

// ============================================================
//  PALETA DE CORES
// ============================================================
const C = {
  bg:           '#3D0A29',              // Fundo mais escuro da página
  surface:      '#5E163F',              // Cards
  surfaceHover: '#6E1E4D',              // Cards em hover
  header:       '#4A1133',              // Cabeçalho / faixas escuras
  accent:       '#F5C000',              // Amarelo dourado
  accentDark:   '#C49800',
  accentLight:  '#FFD740',
  white:        '#FFFFFF',
  wa:           '#25D366',              // Verde WhatsApp
  danger:       '#F25C54',
  muted:        'rgba(255,255,255,0.45)',
  soft:         'rgba(255,255,255,0.75)',
  glass:        'rgba(255,255,255,0.07)',
  glassBorder:  'rgba(255,255,255,0.12)',
  textDark:     '#1E0314',
};

// ============================================================
//  UTILITÁRIOS
// ============================================================
const fmt = (price) =>
  price != null
    ? `R$ ${price.toFixed(2).replace('.', ',')}`
    : null;

const fmtPhone = (v) => {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2)  return d;
  if (d.length <= 6)  return `(${d.slice(0,2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
};

const buildMessage = (cart, orderType, address, customer, obs) => {
  const lines = cart.map(item => {
    if (item.product.isMonte) {
      const sorvList = item.product.sorvetes.map(s => `${s.name} ${s.grams}g`).join(', ');
      const cremList = item.product.cremes.map(c => `${c.name} ${c.grams}g`).join(', ');
      const sub      = fmt(item.product.price * item.qty);
      const qtyNote  = item.qty > 1 ? ` x${item.qty}` : '';
      const parts    = [
        sorvList && `    Sorvetes: ${sorvList}`,
        cremList && `    Cremes: ${cremList}`,
      ].filter(Boolean).join('\n');
      return `  🍦 Monte o Seu — ${item.product.totalGrams * item.qty}g — ${sub}${qtyNote}\n${parts}`;
    }
    const flavor = item.flavor ? ` (${item.flavor})` : '';
    const sub    = fmt(item.product.price * item.qty);
    return `  • ${item.product.name}${flavor} x${item.qty} — ${sub}`;
  });
  const total = cart.reduce((s, i) => s + i.product.price * i.qty, 0);

  const addrBlock = orderType === 'delivery'
    ? `\n📍 *Endereço:*\nRua: ${address.rua}, Nº ${address.numero}\nBairro: ${address.bairro}\nCEP: ${address.cep}${address.complemento ? `\nComplemento: ${address.complemento}` : ''}`
    : '';

  const feeNote = orderType === 'delivery'
    ? `\n⚠️ _${DELIVERY_FEE_NOTE}_`
    : '';

  const obsBlock = obs?.trim()
    ? `\n\n📝 *Observação:* ${obs.trim()}`
    : '';

  return (
    `🍇 *Novo Pedido — Sabor do Açaí*\n\n` +
    `👤 *Cliente:* ${customer.nome}\n` +
    `📞 *Telefone:* ${customer.tel}\n` +
    `📦 *Tipo:* ${orderType === 'delivery' ? 'Entrega 🛵' : 'Retirada 🏪'}` +
    addrBlock +
    `\n\n🛒 *Pedido:*\n${lines.join('\n')}\n\n` +
    `💰 *Total:* ${fmt(total)}${feeNote}${obsBlock}`
  );
};

// ============================================================
//  COMPONENTE: PROGRESS BAR
// ============================================================
function ProgressBar({ step }) {
  const steps = [
    { key: 'cart',     label: 'Carrinho' },
    { key: 'address',  label: 'Endereço' },
    { key: 'personal', label: 'Dados'    },
  ];
  const activeIdx = steps.findIndex(s => s.key === step);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, margin: '0 16px 20px' }}>
      {steps.map((s, i) => {
        const done    = i < activeIdx;
        const current = i === activeIdx;
        return (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                backgroundColor: done ? C.accent : current ? C.accent : C.glass,
                border: `2px solid ${done || current ? C.accent : C.glassBorder}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 800,
                color: done || current ? C.textDark : C.muted,
                transition: 'all .25s',
              }}>
                {done ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: 10, color: current ? C.accent : done ? C.soft : C.muted, fontWeight: 700, whiteSpace: 'nowrap' }}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                flex: 1, height: 2, margin: '0 6px',
                marginBottom: 14,
                backgroundColor: done ? C.accent : C.glass,
                transition: 'background-color .25s',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
//  COMPONENTE: CABEÇALHO
// ============================================================
function Header({ cartQty, cartTotal, onCartClick }) {
  const bounceRef = useRef(null);
  const prevQty   = useRef(cartQty);

  useEffect(() => {
    if (cartQty > prevQty.current && bounceRef.current) {
      bounceRef.current.classList.remove('cart-bounce');
      void bounceRef.current.offsetWidth;
      bounceRef.current.classList.add('cart-bounce');
    }
    prevQty.current = cartQty;
  }, [cartQty]);

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 100,
      backgroundColor: C.header,
      boxShadow: '0 2px 16px rgba(0,0,0,0.5)',
    }}>
      <div style={{
        maxWidth: 600, margin: '0 auto',
        padding: '8px 16px',
        position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Logo centralizada */}
        <img
          src="/images/AC_AI.png"
          alt="Logo Sabor do Açaí"
          onError={e => { e.currentTarget.style.display = 'none'; }}
          style={{
            height: 48,
            width: 'auto',
            maxWidth: 180,
            objectFit: 'contain',
            background: 'transparent',
            display: 'block',
          }}
        />

        {/* Botão carrinho — posição absoluta à direita */}
        <button
          ref={bounceRef}
          onClick={onCartClick}
          style={{
            position: 'absolute', right: 16,
            backgroundColor: cartQty > 0 ? C.accent : C.glass,
            color: cartQty > 0 ? C.textDark : C.soft,
            border: `1.5px solid ${cartQty > 0 ? C.accent : C.glassBorder}`,
            borderRadius: 50,
            padding: '8px 14px',
            fontWeight: 800, fontSize: 14,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            transition: 'all .2s',
            minWidth: 44,
            boxShadow: cartQty > 0 ? '0 2px 10px rgba(245,192,0,0.4)' : 'none',
          }}
        >
          🛒
          {cartQty > 0 && (
            <>
              <span style={{ fontSize: 13 }}>{cartQty}</span>
              <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: 15 }}>
                {fmt(cartTotal)}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ============================================================
//  ORDEM DO SCROLL ÚNICO
// ============================================================
const SCROLL_ORDER = ['combos-250', 'combos-500', 'combos-1kg', 'monte-seu', 'milkshakes', 'outros'];

// ============================================================
//  COMPONENTE: BARRA DE NAVEGAÇÃO POR SEÇÃO (ATALHOS)
// ============================================================
function SectionNavBar({ activeId }) {
  const activeRef = useRef(null);
  const sections  = SCROLL_ORDER
    .map(id => MENU_SECTIONS.find(s => s.id === id))
    .filter(Boolean);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [activeId]);

  const handleClick = (id) => {
    const el = document.getElementById(`section-${id}`);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 120;
    window.scrollTo({ top: y, behavior: 'smooth' });
  };

  return (
    <div
      className="tab-scroll"
      style={{
        display: 'flex', overflowX: 'auto',
        backgroundColor: C.header,
        padding: '8px 12px 10px',
        gap: 8,
        borderBottom: `1px solid ${C.glassBorder}`,
        position: 'sticky', top: 64, zIndex: 90,
      }}
    >
      {sections.map(s => {
        const isActive = s.id === activeId;
        return (
          <button
            key={s.id}
            ref={isActive ? activeRef : null}
            onClick={() => handleClick(s.id)}
            style={{
              flexShrink: 0,
              backgroundColor: isActive ? C.accent : 'transparent',
              color: isActive ? C.textDark : C.soft,
              border: `1.5px solid ${isActive ? C.accent : C.glassBorder}`,
              borderRadius: 50,
              padding: '6px 14px',
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 700, fontSize: 13,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
              whiteSpace: 'nowrap',
              transition: 'all .18s',
              boxShadow: isActive ? '0 2px 8px rgba(245,192,0,0.3)' : 'none',
            }}
          >
            {s.emoji} {s.name}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================
//  COMPONENTE: CARD DE PRODUTO
// ============================================================
function ProductCard({ product, onSelect }) {
  const [hover,    setHover]    = useState(false);
  const [imgError, setImgError] = useState(false);
  const disabled = product.comingSoon || product.price == null;
  const hasImg   = product.image && !imgError;

  return (
    <div
      className="card-enter"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => !disabled && onSelect(product)}
      style={{
        backgroundColor: hover && !disabled ? C.surfaceHover : C.surface,
        borderRadius: 18,
        padding: hasImg ? '0' : '14px 16px',
        display: 'flex', alignItems: 'stretch',
        cursor: disabled ? 'default' : 'pointer',
        transform: hover && !disabled ? 'translateY(-2px)' : 'none',
        boxShadow: hover && !disabled
          ? '0 8px 28px rgba(0,0,0,0.45)'
          : '0 2px 10px rgba(0,0,0,0.25)',
        border: `1px solid ${hover && !disabled ? C.accent + '50' : C.glassBorder}`,
        transition: 'all .2s',
        position: 'relative', overflow: 'hidden',
        minHeight: hasImg ? 100 : 'auto',
      }}
    >
      {/* Imagem à esquerda */}
      {hasImg && (
        <img
          src={product.image}
          alt={product.name}
          onError={() => setImgError(true)}
          style={{
            width: 100, minHeight: 100,
            objectFit: 'cover',
            flexShrink: 0,
            borderRadius: '18px 0 0 18px',
          }}
        />
      )}

      {/* Badge Em Breve */}
      {disabled && (
        <div style={{
          position: 'absolute', top: 10, right: 10,
          backgroundColor: C.accentDark,
          color: C.textDark,
          borderRadius: 50, padding: '2px 10px',
          fontSize: 10, fontWeight: 900, letterSpacing: 0.8,
        }}>
          EM BREVE
        </div>
      )}

      {/* Conteúdo textual */}
      <div style={{
        flex: 1,
        padding: hasImg ? '12px 14px' : '0 8px 0 0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 8,
        paddingRight: disabled && !hasImg ? 72 : hasImg ? 14 : 8,
      }}>
        <div style={{ flex: 1 }}>
          <p style={{ color: C.white, fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
            {product.name}
          </p>
          <p style={{ color: C.muted, fontSize: 12, lineHeight: 1.45 }}>
            {product.ingredients
              ? product.ingredients.join(' • ')
              : product.description}
          </p>
          {product.flavors && !disabled && (
            <p style={{ color: C.accent, fontSize: 11, marginTop: 4, fontWeight: 700 }}>
              🍦 {product.flavors.length} sabores disponíveis
            </p>
          )}
        </div>

        {/* Preço + botão */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
          {!disabled ? (
            <>
              <span style={{
                fontFamily: "'Fredoka One', cursive",
                color: C.accent, fontSize: 21,
              }}>
                {fmt(product.price)}
              </span>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                backgroundColor: C.accent,
                color: C.textDark,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, fontWeight: 900,
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                lineHeight: 1,
              }}>
                +
              </div>
            </>
          ) : (
            <span style={{ color: C.muted, fontSize: 12, fontStyle: 'italic' }}>—</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
//  COMPONENTE: MODAL DE PRODUTO
// ============================================================
function ProductModal({ product, onClose, onAdd }) {
  const [qty,      setQty]      = useState(1);
  const [flavor,   setFlavor]   = useState(product.flavors?.[0] ?? null);
  const [imgError, setImgError] = useState(false);
  const hasImg = product.image && !imgError;

  const handleAdd = () => {
    onAdd(product, qty, flavor);
    onClose();
  };

  return (
    <div
      className="overlay-enter"
      style={{
        position: 'fixed', inset: 0,
        backgroundColor: 'rgba(0,0,0,0.72)',
        zIndex: 200,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="sheet-enter"
        style={{
          backgroundColor: C.header,
          borderRadius: '24px 24px 0 0',
          padding: hasImg ? '0 0 40px' : '8px 20px 40px',
          width: '100%', maxWidth: 600,
          maxHeight: '92vh', overflowY: 'auto',
        }}
      >
        {/* Imagem hero no topo */}
        {hasImg ? (
          <div style={{ position: 'relative' }}>
            <img
              src={product.image}
              alt={product.name}
              onError={() => setImgError(true)}
              style={{
                width: '100%', height: 220,
                objectFit: 'cover',
                borderRadius: '24px 24px 0 0',
                display: 'block',
              }}
            />
            {/* Gradiente sobre a imagem para legibilidade */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
              background: 'linear-gradient(to top, rgba(74,17,51,0.95), transparent)',
              borderRadius: 0,
            }} />
            {/* Botão fechar flutuando sobre a imagem */}
            <button
              onClick={onClose}
              style={{
                position: 'absolute', top: 12, right: 12,
                backgroundColor: 'rgba(0,0,0,0.5)',
                color: C.white, border: 'none',
                borderRadius: '50%', width: 34, height: 34,
                fontSize: 16, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              ✕
            </button>
            {/* Handle sobre o gradiente */}
            <div style={{
              position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
              width: 44, height: 4, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 2,
            }} />
          </div>
        ) : (
          /* Handle sem imagem */
          <div style={{ width: 44, height: 4, backgroundColor: C.glass, borderRadius: 2, margin: '12px auto 20px' }} />
        )}

        {/* Conteúdo textual */}
        <div style={{ padding: hasImg ? '16px 20px 0' : '0' }}>
          <h2 style={{ fontFamily: "'Fredoka One', cursive", color: C.accent, fontSize: 26, marginBottom: 8 }}>
            {product.name}
          </h2>
          <p style={{ color: C.soft, fontSize: 14, lineHeight: 1.55, marginBottom: 20 }}>
            {product.description}
          </p>
        </div>

        {/* Ingredientes + Sabores + Quantidade + Botão — com padding lateral */}
        <div style={{ padding: hasImg ? '0 20px' : '0' }}>

        {product.ingredients && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ color: C.muted, fontSize: 11, fontWeight: 800, letterSpacing: 1.2, marginBottom: 10 }}>
              INGREDIENTES
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {product.ingredients.map(ing => (
                <span key={ing} style={{
                  backgroundColor: C.glass, color: C.white,
                  borderRadius: 50, padding: '5px 13px',
                  fontSize: 12, fontWeight: 600,
                  border: `1px solid ${C.glassBorder}`,
                }}>
                  {ing}
                </span>
              ))}
            </div>
          </div>
        )}

        {product.flavors && (
          <div style={{ marginBottom: 22 }}>
            <p style={{ color: C.muted, fontSize: 11, fontWeight: 800, letterSpacing: 1.2, marginBottom: 10 }}>
              ESCOLHA O SABOR
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {product.flavors.map(f => (
                <button
                  key={f}
                  onClick={() => setFlavor(f)}
                  style={{
                    backgroundColor: flavor === f ? C.accent : C.glass,
                    color: flavor === f ? C.textDark : C.white,
                    border: `1.5px solid ${flavor === f ? C.accent : C.glassBorder}`,
                    borderRadius: 50, padding: '6px 14px',
                    fontSize: 12, fontWeight: 700,
                    cursor: 'pointer', transition: 'all .15s',
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Seletor de quantidade */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          backgroundColor: C.glass,
          borderRadius: 16, padding: '12px 16px', marginBottom: 20,
          border: `1px solid ${C.glassBorder}`,
        }}>
          <span style={{ color: C.soft, fontWeight: 700 }}>Quantidade</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <QtyBtn onClick={() => setQty(q => Math.max(1, q - 1))} label="−" dim />
            <span style={{ color: C.white, fontWeight: 900, fontSize: 22, minWidth: 28, textAlign: 'center' }}>
              {qty}
            </span>
            <QtyBtn onClick={() => setQty(q => q + 1)} label="+" />
          </div>
        </div>

        {/* Botão adicionar */}
        <button
          onClick={handleAdd}
          style={{
            width: '100%',
            backgroundColor: C.accent,
            color: C.textDark,
            border: 'none',
            borderRadius: 16,
            padding: '16px',
            fontFamily: "'Fredoka One', cursive",
            fontSize: 20,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            boxShadow: '0 4px 14px rgba(245,192,0,0.35)',
          }}
        >
          🛒 Adicionar · {fmt(product.price * qty)}
        </button>

        </div>{/* fim padding wrapper */}
      </div>
    </div>
  );
}

// ── botão pequeno de quantidade ──────────────────────────────
function QtyBtn({ onClick, label, dim }) {
  return (
    <button
      onClick={onClick}
      style={{
        backgroundColor: dim ? C.glass : C.accent,
        color: dim ? C.white : C.textDark,
        border: `1px solid ${dim ? C.glassBorder : C.accent}`,
        borderRadius: '50%',
        width: 36, height: 36,
        fontSize: 20, fontWeight: 900,
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        lineHeight: 1,
      }}
    >
      {label}
    </button>
  );
}

// ============================================================
//  COMPONENTE: SEÇÃO "EM BREVE"
// ============================================================
function ComingSoonSection({ section }) {
  return (
    <div className="page-enter" style={{ padding: '20px 16px' }}>
      <div style={{
        backgroundColor: C.surface,
        borderRadius: 20, padding: 28,
        textAlign: 'center',
        border: `1px solid ${C.glassBorder}`,
      }}>
        <div style={{ fontSize: 56, marginBottom: 14 }}>{section.emoji}</div>
        <h3 style={{ fontFamily: "'Fredoka One', cursive", color: C.accent, fontSize: 26, marginBottom: 10 }}>
          {section.name}
        </h3>
        <span style={{
          display: 'inline-block',
          backgroundColor: C.accentDark,
          color: C.textDark,
          borderRadius: 50, padding: '4px 18px',
          fontSize: 11, fontWeight: 900, letterSpacing: 1,
          marginBottom: 18,
        }}>
          EM BREVE
        </span>
        <p style={{ color: C.soft, fontSize: 14, marginBottom: 24 }}>
          Nossos sorvetes artesanais estão chegando! Fique de olho.
        </p>
        {section.flavors && (
          <>
            <p style={{ color: C.muted, fontSize: 11, fontWeight: 800, letterSpacing: 1.2, marginBottom: 12 }}>
              SABORES QUE VÊM POR AÍ
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, justifyContent: 'center' }}>
              {section.flavors.map(f => (
                <span key={f} style={{
                  backgroundColor: C.glass, color: C.muted,
                  borderRadius: 50, padding: '4px 12px',
                  fontSize: 12, border: `1px solid ${C.glassBorder}`,
                }}>
                  {f}
                </span>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
//  COMPONENTE: SEÇÃO INFORMATIVA (CREMES)
// ============================================================
function InfoSection({ section }) {
  return (
    <div className="page-enter" style={{ padding: '20px 16px' }}>
      <div style={{
        backgroundColor: C.surface,
        borderRadius: 20, padding: 24,
        border: `1px solid ${C.glassBorder}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <span style={{ fontSize: 36 }}>{section.emoji}</span>
          <div>
            <h3 style={{ fontFamily: "'Fredoka One', cursive", color: C.accent, fontSize: 22 }}>
              {section.name}
            </h3>
            <p style={{ color: C.muted, fontSize: 12 }}>Complementos especiais para o seu açaí</p>
          </div>
        </div>
        <p style={{ color: C.soft, fontSize: 13, lineHeight: 1.55, marginBottom: 20 }}>
          Nossos cremes são complementos deliciosos que acompanham os combos.
          Disponíveis na loja — peça na hora de montar o seu pedido!
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {section.items.map(item => (
            <div key={item} style={{
              backgroundColor: C.glass,
              borderRadius: 14, padding: '12px 16px',
              display: 'flex', alignItems: 'center', gap: 12,
              border: `1px solid ${C.glassBorder}`,
            }}>
              <span style={{ fontSize: 22 }}>🥄</span>
              <span style={{ color: C.white, fontWeight: 700, fontSize: 15 }}>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
//  COMPONENTE: LINHA DE ITEM COM GRAMAS
//  image (opcional) → exibe foto redonda 80×80 para sorvetes
//  sem image        → layout compacto para cremes
// ============================================================
function GramRow({ name, image, grams, onChange, last }) {
  const [imgErr, setImgErr] = useState(false);
  const selected  = grams > 0;
  const showImage = image && !imgErr;

  const MinusBtn = () => (
    <button
      onClick={() => grams > 0 && onChange(-1)}
      style={{
        backgroundColor: grams === 0 ? 'transparent'
          : grams === 100 ? 'rgba(242,92,84,0.18)' : C.glass,
        color: grams === 0 ? C.muted : grams === 100 ? C.danger : C.white,
        border: `1px solid ${grams === 0 ? 'transparent'
          : grams === 100 ? C.danger + '40' : C.glassBorder}`,
        borderRadius: '50%', width: 32, height: 32,
        fontSize: grams === 100 ? 13 : 18,
        cursor: grams === 0 ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: grams === 0 ? 0.25 : 1,
        transition: 'all .15s', flexShrink: 0,
      }}
    >
      {grams === 100 ? '🗑' : '−'}
    </button>
  );

  const PlusBtn = () => (
    <button
      onClick={() => onChange(1)}
      style={{
        backgroundColor: C.accent, color: C.textDark,
        border: 'none', borderRadius: '50%',
        width: 32, height: 32,
        fontSize: 18, fontWeight: 900,
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      +
    </button>
  );

  const GramLabel = () => (
    <span style={{
      color: selected ? C.accent : C.muted,
      fontFamily: selected ? "'Fredoka One', cursive" : "'Nunito', sans-serif",
      fontSize: selected ? 15 : 13,
      minWidth: 42, textAlign: 'center',
      fontWeight: selected ? 400 : 600,
      transition: 'all .15s',
    }}>
      {grams === 0 ? '—' : `${grams}g`}
    </span>
  );

  /* ── Layout COM imagem (sorvetes) ────────────────────────── */
  if (showImage) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '12px 16px',
        borderBottom: last ? 'none' : `1px solid ${C.glassBorder}`,
        backgroundColor: selected ? `${C.accent}09` : 'transparent',
        transition: 'background-color .15s',
      }}>
        {/* Foto redonda */}
        <img
          src={image}
          alt={name}
          onError={() => setImgErr(true)}
          style={{
            width: 80, height: 80, borderRadius: '50%',
            objectFit: 'cover', flexShrink: 0,
            border: `3px solid ${selected ? C.accent : C.glassBorder}`,
            transition: 'border-color .2s',
            boxShadow: selected ? `0 0 0 3px ${C.accent}30` : 'none',
          }}
        />

        {/* Nome + controles abaixo */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            color: selected ? C.white : C.soft,
            fontWeight: selected ? 700 : 500,
            fontSize: 14, marginBottom: 8,
            transition: 'all .15s',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {name}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MinusBtn />
            <GramLabel />
            <PlusBtn />
          </div>
        </div>
      </div>
    );
  }

  /* ── Layout SEM imagem (cremes) ──────────────────────────── */
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '11px 16px',
      borderBottom: last ? 'none' : `1px solid ${C.glassBorder}`,
      backgroundColor: selected ? `${C.accent}09` : 'transparent',
      transition: 'background-color .15s',
    }}>
      <span style={{
        color: selected ? C.white : C.soft,
        fontWeight: selected ? 700 : 400,
        fontSize: 14, flex: 1,
        transition: 'all .15s',
      }}>
        {name}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <MinusBtn />
        <GramLabel />
        <PlusBtn />
      </div>
    </div>
  );
}

// ============================================================
//  COMPONENTE: MONTE O SEU (interativo por gramas)
// ============================================================
function MonteSeuSection({ section, onAdd, cartHasItems }) {
  const PRICE_PER_KG = 62;
  const [grams, setGrams] = useState({});

  const changeGrams = (name, delta) => {
    setGrams(prev => {
      const cur  = prev[name] || 0;
      // +: se em 0 pula para 100, senão +50 | −: se em 100 volta para 0, senão −50
      const next = delta > 0
        ? (cur === 0 ? 100 : cur + 50)
        : (cur <= 100 ? 0 : cur - 50);
      return { ...prev, [name]: next };
    });
  };

  const totalGrams = Object.values(grams).reduce((s, g) => s + g, 0);
  const totalPrice = (totalGrams / 1000) * PRICE_PER_KG;

  const handleAdd = () => {
    const sorvetes = section.sorvetes
      .filter(s => (grams[s.name] || 0) > 0)
      .map(s => ({ name: s.name, grams: grams[s.name] }));
    const cremes = section.creams
      .filter(c => (grams[c] || 0) > 0)
      .map(c => ({ name: c, grams: grams[c] }));

    onAdd(
      {
        id: `monte-${Date.now()}`,
        name: `🍦 Monte o Seu — ${totalGrams}g`,
        price: totalPrice,
        isMonte: true,
        totalGrams,
        sorvetes,
        cremes,
      },
      1,
      null
    );
    setGrams({}); // zera tudo após adicionar
  };

  // A barra flutuante sobe quando o carrinho já tem itens (evita sobreposição)
  const bottomOffset = cartHasItems ? 86 : 14;

  return (
    <div className="page-enter" style={{ padding: '14px 14px', paddingBottom: totalGrams > 0 ? 110 : 24 }}>

      {/* Card de destaque */}
      <div style={{
        background: `linear-gradient(135deg, ${C.accent}22, ${C.accent}08)`,
        border: `2px solid ${C.accent}60`,
        borderRadius: 20, padding: '16px 18px', marginBottom: 14,
        display: 'flex', gap: 12, alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: 30, flexShrink: 0, lineHeight: 1.1 }}>🍦</span>
        <p style={{
          color: C.accent,
          fontFamily: "'Fredoka One', cursive",
          fontSize: 16, lineHeight: 1.5,
        }}>
          {section.highlight}
        </p>
      </div>

      {/* Lista de SORVETES */}
      <div style={{
        backgroundColor: C.surface, borderRadius: 18, marginBottom: 12,
        border: `1px solid ${C.glassBorder}`, overflow: 'hidden',
      }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.glassBorder}` }}>
          <p style={{ color: C.muted, fontSize: 11, fontWeight: 800, letterSpacing: 1.2 }}>
            🍨 SORVETES
          </p>
        </div>
        {section.sorvetes.map((s, i) => (
          <GramRow
            key={s.name}
            name={s.name}
            image={s.image}
            grams={grams[s.name] || 0}
            onChange={delta => changeGrams(s.name, delta)}
            last={i === section.sorvetes.length - 1}
          />
        ))}
      </div>

      {/* Lista de CREMES */}
      <div style={{
        backgroundColor: C.surface, borderRadius: 18, marginBottom: 16,
        border: `1px solid ${C.glassBorder}`, overflow: 'hidden',
      }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.glassBorder}` }}>
          <p style={{ color: C.muted, fontSize: 11, fontWeight: 800, letterSpacing: 1.2 }}>
            🥄 CREMES ESPECIAIS
          </p>
        </div>
        {section.creams.map((name, i) => (
          <GramRow
            key={name}
            name={name}
            grams={grams[name] || 0}
            onChange={delta => changeGrams(name, delta)}
            last={i === section.creams.length - 1}
          />
        ))}
      </div>

      {/* Barra flutuante: total + botão (aparece só com algo selecionado) */}
      {totalGrams > 0 && (
        <div className="pop-enter" style={{
          position: 'fixed',
          bottom: bottomOffset, left: 14, right: 14,
          maxWidth: 572, margin: '0 auto',
          zIndex: 145,
        }}>
          <div style={{
            backgroundColor: C.header,
            borderRadius: 16,
            padding: '12px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            border: `1.5px solid ${C.accent}55`,
            boxShadow: '0 6px 24px rgba(0,0,0,0.6)',
          }}>
            <div>
              <p style={{ color: C.muted, fontSize: 11, fontWeight: 700, marginBottom: 2 }}>
                Total selecionado
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ color: C.soft, fontWeight: 800, fontSize: 14 }}>{totalGrams}g</span>
                <span style={{ color: C.accent, fontFamily: "'Fredoka One', cursive", fontSize: 22 }}>
                  {fmt(totalPrice)}
                </span>
              </div>
            </div>
            <button
              onClick={handleAdd}
              style={{
                backgroundColor: C.accent, color: C.textDark,
                border: 'none', borderRadius: 12,
                padding: '10px 20px',
                fontFamily: "'Fredoka One', cursive",
                fontSize: 17, cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 8px rgba(245,192,0,0.35)',
              }}
            >
              🛒 Adicionar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
//  PÁGINA: CARDÁPIO (scroll único)
// ============================================================
function MenuPage({ cart, onAdd, onGoToCart }) {
  const [activeId,  setActiveId]  = useState(SCROLL_ORDER[0]);
  const [selected,  setSelected]  = useState(null);

  const cartQty   = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0);

  const orderedSections = SCROLL_ORDER
    .map(id => MENU_SECTIONS.find(s => s.id === id))
    .filter(Boolean);

  // Atualiza o atalho ativo conforme o scroll
  useEffect(() => {
    const observers = SCROLL_ORDER.map(id => {
      const el = document.getElementById(`section-${id}`);
      if (!el) return null;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveId(id); },
        { rootMargin: '-20% 0px -70% 0px' }
      );
      obs.observe(el);
      return obs;
    }).filter(Boolean);
    return () => observers.forEach(o => o.disconnect());
  }, []);

  return (
    <div>
      <SectionNavBar activeId={activeId} />

      <div style={{ maxWidth: 600, margin: '0 auto', paddingBottom: cartQty > 0 ? 100 : 40 }}>
        {orderedSections.map(section => {
          const isMonte = section.type === 'monte';
          return (
            <div
              key={section.id}
              id={`section-${section.id}`}
              style={isMonte ? {
                background: `linear-gradient(to bottom, ${C.accent}0A, ${C.accent}03)`,
                borderTop: `1px solid ${C.accent}35`,
                borderBottom: `1px solid ${C.accent}35`,
                marginTop: 4,
              } : {}}
            >
              {/* Título da seção */}
              <div style={{ padding: '22px 16px 10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 22 }}>{section.emoji}</span>
                  <h2 style={{
                    fontFamily: "'Fredoka One', cursive",
                    color: C.accent, fontSize: 22, lineHeight: 1,
                  }}>
                    {section.name}
                  </h2>
                  {isMonte && (
                    <span style={{
                      backgroundColor: `${C.accent}20`,
                      color: C.accent,
                      border: `1px solid ${C.accent}50`,
                      borderRadius: 50, padding: '2px 10px',
                      fontSize: 10, fontWeight: 800, letterSpacing: 0.8,
                    }}>
                      INTERATIVO
                    </span>
                  )}
                </div>
              </div>

              {/* Conteúdo */}
              {section.type === 'regular' && (
                <div style={{ padding: '0 14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {section.products.map(p => (
                    <ProductCard key={p.id} product={p} onSelect={setSelected} />
                  ))}
                </div>
              )}
              {section.type === 'monte' && (
                <MonteSeuSection section={section} onAdd={onAdd} cartHasItems={cartQty > 0} />
              )}
            </div>
          );
        })}
      </div>

      {/* Barra flutuante do carrinho */}
      {cartQty > 0 && (
        <div className="pop-enter" style={{
          position: 'fixed', bottom: 14, left: 14, right: 14,
          maxWidth: 572, margin: '0 auto', zIndex: 150,
        }}>
          <button
            onClick={onGoToCart}
            style={{
              width: '100%',
              backgroundColor: C.accent,
              color: C.textDark,
              border: 'none',
              borderRadius: 16,
              padding: '14px 18px',
              fontFamily: "'Fredoka One', cursive",
              fontSize: 18, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              boxShadow: '0 6px 24px rgba(0,0,0,0.55)',
            }}
          >
            <span style={{
              backgroundColor: 'rgba(0,0,0,0.18)',
              borderRadius: 50, padding: '2px 12px',
              fontSize: 14, fontWeight: 800,
            }}>
              {cartQty} {cartQty === 1 ? 'item' : 'itens'}
            </span>
            <span>Ver Carrinho 🛒</span>
            <span style={{ fontFamily: "'Fredoka One', cursive" }}>{fmt(cartTotal)}</span>
          </button>
        </div>
      )}

      {selected && (
        <ProductModal product={selected} onClose={() => setSelected(null)} onAdd={onAdd} />
      )}
    </div>
  );
}

// ============================================================
//  PÁGINA: CARRINHO
// ============================================================
function CartPage({ cart, setCart, onBack, onContinue }) {
  const [orderType, setOrderType] = useState('pickup');
  const [obsOn,     setObsOn]     = useState(false);
  const [obs,       setObs]       = useState('');
  const total = cart.reduce((s, i) => s + i.product.price * i.qty, 0);

  const updateQty = (product, flavor, delta) => {
    setCart(prev =>
      prev
        .map(i =>
          i.product.id === product.id && i.flavor === flavor
            ? { ...i, qty: i.qty + delta }
            : i
        )
        .filter(i => i.qty > 0)
    );
  };

  return (
    <div className="page-enter" style={{ maxWidth: 600, margin: '0 auto', padding: '16px 14px 110px' }}>
      {/* Cabeçalho da página */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <BackBtn onClick={onBack} />
        <h2 style={{ fontFamily: "'Fredoka One', cursive", color: C.accent, fontSize: 26 }}>
          🛒 Meu Carrinho
        </h2>
      </div>

      {cart.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 72, marginBottom: 16 }}>🛒</div>
          <p style={{ color: C.soft, fontSize: 17, marginBottom: 20 }}>Seu carrinho está vazio</p>
          <button onClick={onBack} style={btnStyle(C.accent, C.textDark)}>
            Ver Cardápio 🍇
          </button>
        </div>
      ) : (
        <>
          {/* Lista de itens */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {cart.map((item, idx) => (
              <div key={idx} style={{
                backgroundColor: C.surface,
                borderRadius: 16, padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
                border: `1px solid ${C.glassBorder}`,
              }}>
                <div style={{ flex: 1 }}>
                  <p style={{ color: C.white, fontWeight: 700, fontSize: 15, marginBottom: 2 }}>
                    {item.product.name}
                  </p>
                  {item.product.isMonte ? (
                    <>
                      {item.product.sorvetes.length > 0 && (
                        <p style={{ color: C.muted, fontSize: 11, lineHeight: 1.4, marginBottom: 1 }}>
                          🍨 {item.product.sorvetes.map(s => `${s.name} ${s.grams}g`).join(', ')}
                        </p>
                      )}
                      {item.product.cremes.length > 0 && (
                        <p style={{ color: C.muted, fontSize: 11, lineHeight: 1.4, marginBottom: 2 }}>
                          🥄 {item.product.cremes.map(c => `${c.name} ${c.grams}g`).join(', ')}
                        </p>
                      )}
                    </>
                  ) : (
                    item.flavor && (
                      <p style={{ color: C.muted, fontSize: 12, marginBottom: 2 }}>🍦 {item.flavor}</p>
                    )
                  )}
                  <p style={{ fontFamily: "'Fredoka One', cursive", color: C.accent, fontSize: 17 }}>
                    {fmt(item.product.price * item.qty)}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    onClick={() => updateQty(item.product, item.flavor, -1)}
                    style={{
                      backgroundColor: item.qty === 1 ? 'rgba(242,92,84,0.2)' : C.glass,
                      color: item.qty === 1 ? C.danger : C.white,
                      border: `1px solid ${item.qty === 1 ? C.danger + '50' : C.glassBorder}`,
                      borderRadius: '50%', width: 32, height: 32,
                      fontSize: 16, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {item.qty === 1 ? '🗑' : '−'}
                  </button>
                  <span style={{ color: C.white, fontWeight: 900, fontSize: 18, minWidth: 22, textAlign: 'center' }}>
                    {item.qty}
                  </span>
                  <button
                    onClick={() => updateQty(item.product, item.flavor, 1)}
                    style={{
                      backgroundColor: C.accent, color: C.textDark,
                      border: 'none', borderRadius: '50%',
                      width: 32, height: 32, fontSize: 18, fontWeight: 900,
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Tipo de pedido */}
          <div style={{
            backgroundColor: C.surface,
            borderRadius: 16, padding: 16, marginBottom: 16,
            border: `1px solid ${C.glassBorder}`,
          }}>
            <p style={{ color: C.muted, fontSize: 11, fontWeight: 800, letterSpacing: 1.2, marginBottom: 12 }}>
              COMO VOCÊ QUER RECEBER?
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { v: 'pickup',   icon: '🏪', title: 'Retirada',  desc: 'Retire na loja' },
                { v: 'delivery', icon: '🛵', title: 'Entrega',   desc: DELIVERY_FEE_NOTE },
              ].map(opt => (
                <button
                  key={opt.v}
                  onClick={() => setOrderType(opt.v)}
                  style={{
                    flex: 1,
                    backgroundColor: orderType === opt.v ? C.accent : C.glass,
                    color: orderType === opt.v ? C.textDark : C.white,
                    border: `2px solid ${orderType === opt.v ? C.accent : C.glassBorder}`,
                    borderRadius: 14, padding: '12px 8px',
                    cursor: 'pointer', fontFamily: "'Nunito', sans-serif",
                    textAlign: 'center', transition: 'all .18s',
                  }}
                >
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{opt.icon}</div>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>{opt.title}</div>
                  <div style={{ fontSize: 10, opacity: 0.75, marginTop: 2 }}>{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Aviso entrega */}
          {orderType === 'delivery' && (
            <div style={{
              backgroundColor: 'rgba(245,192,0,0.1)',
              borderRadius: 12, padding: '10px 14px', marginBottom: 16,
              border: `1px solid ${C.accent}40`,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ fontSize: 18 }}>⚠️</span>
              <span style={{ color: C.accent, fontSize: 13, fontWeight: 600 }}>
                {DELIVERY_FEE_NOTE}
              </span>
            </div>
          )}

          {/* Observação */}
          <div style={{
            backgroundColor: C.surface,
            borderRadius: 16, padding: 16, marginBottom: 16,
            border: `1px solid ${obsOn ? C.accent + '50' : C.glassBorder}`,
            transition: 'border-color .2s',
          }}>
            {/* Toggle */}
            <button
              onClick={() => setObsOn(v => !v)}
              style={{
                width: '100%', background: 'none', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer', padding: 0,
              }}
            >
              <span style={{ color: C.soft, fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                📝 Adicionar observação ao pedido
              </span>
              {/* Switch visual */}
              <div style={{
                width: 42, height: 24, borderRadius: 12,
                backgroundColor: obsOn ? C.accent : C.glass,
                border: `1.5px solid ${obsOn ? C.accent : C.glassBorder}`,
                position: 'relative', flexShrink: 0,
                transition: 'background-color .2s',
              }}>
                <div style={{
                  position: 'absolute',
                  top: 2, left: obsOn ? 18 : 2,
                  width: 16, height: 16, borderRadius: '50%',
                  backgroundColor: obsOn ? C.textDark : C.muted,
                  transition: 'left .2s',
                }} />
              </div>
            </button>

            {/* Textarea — aparece só quando ativo */}
            {obsOn && (
              <textarea
                value={obs}
                onChange={e => setObs(e.target.value)}
                placeholder="Ex: sem castanha, ponto de retirada específico..."
                rows={3}
                style={{
                  marginTop: 14,
                  width: '100%',
                  backgroundColor: C.header,
                  color: C.white,
                  border: `1.5px solid ${C.glassBorder}`,
                  borderRadius: 12, padding: '11px 14px',
                  fontSize: 14, resize: 'vertical',
                  outline: 'none', lineHeight: 1.5,
                }}
                onFocus={e  => { e.target.style.borderColor = C.accent + '80'; }}
                onBlur={e   => { e.target.style.borderColor = C.glassBorder; }}
              />
            )}
          </div>

          {/* Total */}
          <div style={{
            backgroundColor: C.header,
            borderRadius: 16, padding: '14px 18px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            border: `1px solid ${C.accent}35`,
          }}>
            <span style={{ color: C.soft, fontWeight: 700 }}>Total dos itens</span>
            <span style={{ fontFamily: "'Fredoka One', cursive", color: C.accent, fontSize: 26 }}>
              {fmt(total)}
            </span>
          </div>

          {/* Botão continuar */}
          <FixedBottomBtn onClick={() => onContinue(orderType, obsOn ? obs : '')}>
            Continuar →
          </FixedBottomBtn>
        </>
      )}
    </div>
  );
}

// ============================================================
//  PÁGINA: ENDEREÇO
// ============================================================
function AddressPage({ onBack, onContinue }) {
  const [addr,   setAddr]   = useState({ rua: '', bairro: '', numero: '', complemento: '', cep: '' });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!addr.rua.trim())    e.rua    = 'Obrigatório';
    if (!addr.bairro.trim()) e.bairro = 'Obrigatório';
    if (!addr.numero.trim()) e.numero = 'Obrigatório';
    if (!addr.cep.trim())    e.cep    = 'Obrigatório';
    setErrors(e);
    return !Object.keys(e).length;
  };

  return (
    <div className="page-enter" style={{ maxWidth: 600, margin: '0 auto', padding: '16px 14px 110px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <BackBtn onClick={onBack} />
        <h2 style={{ fontFamily: "'Fredoka One', cursive", color: C.accent, fontSize: 26 }}>
          📍 Endereço de Entrega
        </h2>
      </div>

      <ProgressBar step="address" />

      <FormField label="RUA / AVENIDA" placeholder="Ex: Rua das Flores" value={addr.rua}
        error={errors.rua} onChange={v => setAddr(a => ({ ...a, rua: v }))} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <FormField label="NÚMERO" placeholder="Ex: 123" value={addr.numero}
          error={errors.numero} onChange={v => setAddr(a => ({ ...a, numero: v }))} />
        <FormField label="CEP" placeholder="00000-000" value={addr.cep}
          error={errors.cep} onChange={v => setAddr(a => ({ ...a, cep: v }))} />
      </div>

      <FormField label="BAIRRO" placeholder="Ex: Centro" value={addr.bairro}
        error={errors.bairro} onChange={v => setAddr(a => ({ ...a, bairro: v }))} />

      <FormField label="COMPLEMENTO" placeholder="Ex: Apto 101, Bloco B" optional value={addr.complemento}
        onChange={v => setAddr(a => ({ ...a, complemento: v }))} />

      <FixedBottomBtn onClick={() => validate() && onContinue(addr)}>
        Continuar →
      </FixedBottomBtn>
    </div>
  );
}

// ============================================================
//  PÁGINA: DADOS PESSOAIS
// ============================================================
function PersonalPage({ cart, orderType, address, onBack, onSubmit }) {
  const [info,   setInfo]   = useState({ nome: '', tel: '' });
  const [errors, setErrors] = useState({});
  const total = cart.reduce((s, i) => s + i.product.price * i.qty, 0);

  const validate = () => {
    const e = {};
    if (info.nome.trim().length < 2)           e.nome = 'Nome deve ter pelo menos 2 caracteres';
    if (info.tel.replace(/\D/g, '').length < 10) e.tel  = 'Número de telefone inválido';
    setErrors(e);
    return !Object.keys(e).length;
  };

  return (
    <div className="page-enter" style={{ maxWidth: 600, margin: '0 auto', padding: '16px 14px 110px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <BackBtn onClick={onBack} />
        <h2 style={{ fontFamily: "'Fredoka One', cursive", color: C.accent, fontSize: 26 }}>
          👤 Seus Dados
        </h2>
      </div>

      <ProgressBar step="personal" />

      {/* Resumo do pedido */}
      <div style={{
        backgroundColor: C.surface,
        borderRadius: 16, padding: 16, marginBottom: 20,
        border: `1px solid ${C.glassBorder}`,
      }}>
        <p style={{ color: C.muted, fontSize: 11, fontWeight: 800, letterSpacing: 1.2, marginBottom: 12 }}>
          RESUMO DO PEDIDO
        </p>
        {cart.map((item, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: C.soft, fontSize: 13 }}>
                {item.product.name}{!item.product.isMonte && item.flavor ? ` (${item.flavor})` : ''} x{item.qty}
              </span>
              <span style={{ color: C.white, fontSize: 13, fontWeight: 700 }}>
                {fmt(item.product.price * item.qty)}
              </span>
            </div>
            {item.product.isMonte && item.product.sorvetes.length > 0 && (
              <p style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>
                🍨 {item.product.sorvetes.map(s => `${s.name} ${s.grams}g`).join(', ')}
              </p>
            )}
            {item.product.isMonte && item.product.cremes.length > 0 && (
              <p style={{ color: C.muted, fontSize: 11, marginTop: 1 }}>
                🥄 {item.product.cremes.map(c => `${c.name} ${c.grams}g`).join(', ')}
              </p>
            )}
          </div>
        ))}
        <div style={{
          borderTop: `1px solid ${C.glassBorder}`, paddingTop: 10, marginTop: 8,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ color: C.soft, fontWeight: 700 }}>Total</span>
          <span style={{ fontFamily: "'Fredoka One', cursive", color: C.accent, fontSize: 22 }}>
            {fmt(total)}
          </span>
        </div>
        {orderType === 'delivery' && (
          <p style={{ color: C.accent, fontSize: 11, marginTop: 8, fontWeight: 600 }}>
            ⚠️ + {DELIVERY_FEE_NOTE}
          </p>
        )}
      </div>

      <FormField label="NOME COMPLETO" placeholder="Ex: João Silva" value={info.nome}
        error={errors.nome} onChange={v => setInfo(i => ({ ...i, nome: v }))} />

      <FormField label="TELEFONE" placeholder="(87) 99999-9999" value={info.tel}
        error={errors.tel} type="tel"
        onChange={v => setInfo(i => ({ ...i, tel: fmtPhone(v) }))} />

      <FixedBottomBtn
        color={C.wa}
        textColor={C.white}
        onClick={() => validate() && onSubmit(info)}
      >
        📱 Enviar pelo WhatsApp
      </FixedBottomBtn>
    </div>
  );
}

// ============================================================
//  HELPERS DE UI reutilizáveis
// ============================================================
function BackBtn({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        backgroundColor: C.glass, color: C.white,
        border: `1px solid ${C.glassBorder}`,
        borderRadius: '50%', width: 40, height: 40,
        fontSize: 18, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      ←
    </button>
  );
}

function FixedBottomBtn({ onClick, children, color = C.accent, textColor = C.textDark }) {
  return (
    <div style={{
      position: 'fixed', bottom: 14, left: 14, right: 14,
      maxWidth: 572, margin: '0 auto', zIndex: 150,
    }}>
      <button
        onClick={onClick}
        style={{
          width: '100%',
          backgroundColor: color, color: textColor,
          border: 'none', borderRadius: 16,
          padding: '16px',
          fontFamily: "'Fredoka One', cursive",
          fontSize: 20, cursor: 'pointer',
          boxShadow: '0 6px 24px rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {children}
      </button>
    </div>
  );
}

function FormField({ label, placeholder, value, onChange, error, optional, type = 'text' }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{
        display: 'block', color: C.muted,
        fontSize: 11, fontWeight: 800, letterSpacing: 1.2, marginBottom: 7,
      }}>
        {label}
        {optional && <span style={{ color: C.muted, fontWeight: 400, letterSpacing: 0 }}> (opcional)</span>}
      </label>
      <input
        value={value}
        type={type}
        inputMode={type === 'tel' ? 'numeric' : 'text'}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          backgroundColor: C.surface,
          color: C.white,
          border: `2px solid ${error ? C.danger : C.glassBorder}`,
          borderRadius: 13, padding: '13px 15px',
          fontSize: 15, outline: 'none',
          transition: 'border-color .2s',
        }}
        onFocus={e => { if (!error) e.target.style.borderColor = C.accent + '80'; }}
        onBlur={e  => { e.target.style.borderColor = error ? C.danger : C.glassBorder; }}
      />
      {error && <p style={{ color: C.danger, fontSize: 11, marginTop: 5, fontWeight: 700 }}>{error}</p>}
    </div>
  );
}

function btnStyle(bg, color) {
  return {
    backgroundColor: bg, color,
    border: 'none', borderRadius: 14,
    padding: '13px 28px',
    fontFamily: "'Fredoka One', cursive",
    fontSize: 18, cursor: 'pointer',
  };
}

// ============================================================
//  APP PRINCIPAL
// ============================================================
export default function App() {
  const [step,      setStep]      = useState('menu');   // menu | cart | address | personal
  const [cart,      setCart]      = useState([]);
  const [orderType, setOrderType] = useState('pickup');
  const [address,   setAddress]   = useState(null);
  const [obs,       setObs]       = useState('');

  const cartQty   = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0);

  const addToCart = useCallback((product, qty, flavor) => {
    setCart(prev => {
      const idx = prev.findIndex(
        i => i.product.id === product.id && i.flavor === flavor
      );
      if (idx >= 0) {
        return prev.map((i, n) => n === idx ? { ...i, qty: i.qty + qty } : i);
      }
      return [...prev, { product, qty, flavor }];
    });
  }, []);

  const handleCartContinue = (type, obsText) => {
    setOrderType(type);
    setObs(obsText);
    setStep(type === 'delivery' ? 'address' : 'personal');
  };

  const handleAddressContinue = (addr) => {
    setAddress(addr);
    setStep('personal');
  };

  const handleSubmit = (customer) => {
    const msg     = buildMessage(cart, orderType, address ?? {}, customer, obs);
    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`, '_blank');
  };

  return (
    <div style={{
      fontFamily: "'Nunito', sans-serif",
      backgroundColor: C.bg,
      minHeight: '100vh',
    }}>
      <Header
        cartQty={cartQty}
        cartTotal={cartTotal}
        onCartClick={() => step !== 'cart' && cartQty > 0 && setStep('cart')}
      />

      {step === 'menu'     && (
        <MenuPage
          cart={cart}
          onAdd={addToCart}
          onGoToCart={() => setStep('cart')}
        />
      )}
      {step === 'cart'     && (
        <CartPage
          cart={cart}
          setCart={setCart}
          onBack={() => setStep('menu')}
          onContinue={handleCartContinue}
        />
      )}
      {step === 'address'  && (
        <AddressPage
          onBack={() => setStep('cart')}
          onContinue={handleAddressContinue}
        />
      )}
      {step === 'personal' && (
        <PersonalPage
          cart={cart}
          orderType={orderType}
          address={address}
          onBack={() => setStep(orderType === 'delivery' ? 'address' : 'cart')}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
