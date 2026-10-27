export function BrandLogo({ compact = false, large = false }: { compact?: boolean; large?: boolean }) {
  return <div className={`brand-logo ${compact ? 'compact' : ''} ${large ? 'large' : ''}`}>
    <img src="/brand/gcl-symbol-original.jpeg" alt="Símbolo GCL Technology" />
    {!compact && <span><strong>Collect<span>AI</span></strong><small>by GCL Technology</small></span>}
  </div>
}
