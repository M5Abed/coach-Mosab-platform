const logos = {
  Instapay: { src: '/icons/instapay.png', background: 'bg-white' },
  'Vodafone Cash': { src: '/icons/vodafone.svg', background: 'bg-white', inset: 'p-1' },
  'Orange Money': { src: '/icons/orange.svg', background: 'bg-[#FF7900]', inset: 'p-1' },
  'Orange Cash': { src: '/icons/orange.svg', background: 'bg-[#FF7900]', inset: 'p-1' },
  'Etisalat Cash': { src: '/icons/etisalat.png', background: 'bg-white' },
  'WE Pay': { src: '/icons/we.png', background: 'bg-white', fit: 'object-cover object-right' },
}

export function PaymentMethodIcon({ name, className = '' }) {
  const logo = logos[name]
  if (!logo) return null

  return (
    <span aria-hidden="true" className={`inline-flex shrink-0 overflow-hidden rounded-md ${logo.background} ${className || 'size-6'}`}>
      <img src={logo.src} alt="" loading="lazy" className={`size-full ${logo.fit || 'object-contain'} ${logo.inset || ''}`} />
    </span>
  )
}
