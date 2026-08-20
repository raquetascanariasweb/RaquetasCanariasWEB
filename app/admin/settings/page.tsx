'use client'

import { useEffect, useState, useCallback } from 'react'
import React from 'react'
import {
  Settings2, Store, BadgeInfo, Image, Palette, Type, CreditCard,
  Truck, Receipt, FileText, Bell, Search, Globe, Shield, Scale, Users,
  MessageSquare, Save,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getAllSettings, updateSetting, saveSetting } from '@/lib/admin/settings'
import { renderEmailTemplatePreview } from '@/lib/admin/email-preview'
import { toast } from 'sonner'

type SectionKey =
  | 'general' | 'store' | 'brand' | 'logo' | 'colors' | 'typography'
  | 'payments' | 'shipping' | 'taxes' | 'email_templates' | 'notifications'
  | 'seo' | 'domains' | 'legal' | 'social' | 'news_ticker'

const SECTIONS: { key: SectionKey; label: string; icon: any; description: string }[] = [
  { key: 'general', label: 'General', icon: Settings2, description: 'Nombre de la tienda, moneda, idioma' },
  { key: 'store', label: 'Información de la tienda', icon: Store, description: 'Dirección, teléfono, email de contacto' },
  { key: 'brand', label: 'Marca', icon: BadgeInfo, description: 'Nombre de la marca, eslogan, acerca de' },
  { key: 'logo', label: 'Logo', icon: Image, description: 'Subida de logo y favicon' },
  { key: 'colors', label: 'Colores', icon: Palette, description: 'Paleta de colores de la marca' },
  { key: 'typography', label: 'Tipografía', icon: Type, description: 'Configuración de fuentes' },
  { key: 'payments', label: 'Pagos', icon: CreditCard, description: 'Stripe, PayPal' },
  { key: 'shipping', label: 'Envíos', icon: Truck, description: 'Zonas, tarifas, manipulación' },
  { key: 'taxes', label: 'Impuestos', icon: Receipt, description: 'Tipos de impuesto y ajustes' },
  { key: 'email_templates', label: 'Plantillas de email', icon: FileText, description: 'Emails de pedido y envío' },
  { key: 'notifications', label: 'Notificaciones', icon: Bell, description: 'Preferencias de alertas y correo electrónico' },
  { key: 'seo', label: 'SEO', icon: Search, description: 'Meta, analítica, scripts' },
  { key: 'domains', label: 'Dominios', icon: Globe, description: 'Dominios personalizados y SSL' },
  { key: 'legal', label: 'Páginas legales', icon: Scale, description: 'Políticas, términos, privacidad' },
  { key: 'social', label: 'Redes sociales', icon: Users, description: 'Enlaces a redes sociales' },
  { key: 'news_ticker', label: 'Cinta de anuncios', icon: MessageSquare, description: 'Texto de la barra de anuncios superior' },
]

const DEFAULTS: Record<SectionKey, any> = {
  general: { store_name: 'Raquetas Canarias', store_description: '', store_currency: 'EUR', store_timezone: 'Atlantic/Canary', store_language: 'es' },
  store: { address_line1: '', address_line2: '', city: '', state: '', zip: '', country: 'US', phone: '', email: '' },
  brand: { brand_name: 'Raquetas Canarias', brand_tagline: '', brand_about: '' },
  logo: { logo_url: '', logo_alt: 'Raquetas Canarias', favicon_url: '' },
  colors: { primary: '#e85d2c', secondary: '#1a1a1a', accent: '#1b6b93', background: '#fdfcfa', text: '#1a1a1a' },
  typography: { heading_font: 'Space Grotesk', body_font: 'DM Sans', base_font_size: 16 },
  payments: { stripe_publishable_key: '', stripe_secret_key: '', stripe_webhook_secret: '', paypal_client_id: '', test_mode: true, bizum_enabled: false, bizum_phone: '' },
  shipping: { shipping_rate: 10, free_shipping_threshold: 200, default_weight_unit: 'lbs', handling_fee: 0, shipping_zones: '' },
  taxes: { default_tax_rate: 0, tax_inclusive_pricing: false, charge_tax_on_shipping: false, tax_jurisdictions: '' },
  email_templates: {
    order_confirmation_subject: 'Pedido confirmado — #{order_number}',
    order_confirmation_body: `<div style="font-family:'DM Sans',Arial,sans-serif;color:#1a1a1a;line-height:1.6;max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #ecdbc8;border-radius:8px;padding:32px;">
  <div style="text-align:center;margin-bottom:24px;"><span style="font-size:28px;">✨</span></div>
  <h2 style="color:#1a1a1a;font-size:22px;margin:0 0 16px;text-align:center;">¡Gracias por tu compra en Raquetas Canarias!</h2>
  <p style="margin:0 0 12px;">Hola,</p>
  <p style="margin:0 0 16px;">Hemos recibido tu pedido <strong>#{order_number}</strong> correctamente y ya nos hemos puesto manos a la obra para prepararlo.</p>
  <p style="margin:0 0 16px;">Te enviaremos otro correo electrónico en cuanto tu paquete salga de nuestros almacenes.</p>
  <div style="background:#f5f5f7;border-radius:8px;padding:16px;margin:24px 0;">
    <p style="margin:0;font-size:14px;color:#555;">Si tienes alguna duda sobre tu compra o necesitas realizar algún cambio, contáctanos respondiendo a este correo.</p>
  </div>
  <p style="margin:0 0 16px;">¡Gracias por confiar en nosotros!</p>
  <p style="margin:24px 0 0;padding-top:24px;border-top:1px solid #eee;font-size:14px;color:#666;">
    Saludos,<br><strong style="color:#1a1a1a;">El equipo de Raquetas Canarias</strong>
  </p>
</div>`,
    shipping_confirmation_subject: 'Tu pedido ha sido enviado — #{order_number}',
    shipping_confirmation_body: `<div style="font-family:'DM Sans',Arial,sans-serif;color:#1a1a1a;line-height:1.6;max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #ecdbc8;border-radius:8px;padding:32px;">
  <div style="text-align:center;margin-bottom:24px;"><span style="font-size:28px;">🚀</span></div>
  <h2 style="color:#1a1a1a;font-size:22px;margin:0 0 16px;text-align:center;">¡Buenas noticias! Tu pedido ya está en camino</h2>
  <p style="margin:0 0 12px;">Hola,</p>
  <p style="margin:0 0 16px;">Queríamos avisarte de que tu pedido <strong>#{order_number}</strong> ya ha salido de nuestras instalaciones y se dirige hacia tu dirección.</p>
  <p style="margin:0 0 16px;">Prepárate, porque muy pronto podrás disfrutar de tus artículos.</p>
  <div style="background:#f5f5f7;border-radius:8px;padding:16px;margin:24px 0;">
    <p style="margin:0;font-size:14px;color:#555;">Si tienes cualquier problema con la entrega, no dudes en escribirnos.</p>
  </div>
  <p style="margin:0 0 16px;">¡Esperamos que lo disfrutes mucho!</p>
  <p style="margin:24px 0 0;padding-top:24px;border-top:1px solid #eee;font-size:14px;color:#666;">
    Saludos,<br><strong style="color:#1a1a1a;">El equipo de Raquetas Canarias</strong>
  </p>
</div>`,
  },
  notifications: { order_confirmed: true, order_shipped: true, order_delivered: true, low_stock_alert: true, new_subscriber: false, notification_email: '' },
  seo: { global_title: 'Raquetas Canarias — Pádel y Tenis', global_description: '', og_image: '', google_analytics_id: '', facebook_pixel_id: '', robots_txt: '', custom_head_scripts: '' },
  domains: { primary_domain: 'raquetascanarias.com', redirect_www: true, force_https: true, custom_domains: '' },
  legal: { privacy_policy: '', terms_of_service: '', refund_policy: '', shipping_policy: '', cookie_policy: '' },
  social: { instagram: '', facebook: '', twitter: '', pinterest: '', tiktok: '', youtube: '', linkedin: '' },
  news_ticker: { enabled: false, text: '' },
}

// ── Extracted memoized input components ──

const SettingsField = React.memo(function SettingsField({
  value, onChange, label, placeholder, type = 'text', rows, options,
}: {
  value: any
  onChange: (v: any) => void
  label: string
  placeholder?: string
  type?: string
  rows?: number
  options?: { value: string; label: string }[]
}) {
  return (
    <div>
      <Label>{label}</Label>
      {options ? (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
      ) : type === 'textarea' ? (
        <textarea rows={rows ?? 3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      ) : type === 'number' ? (
        <Input type="number" value={value} onChange={(e) => onChange(parseFloat(e.target.value) || 0)} placeholder={placeholder} />
      ) : (
        <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      )}
    </div>
  )
})

const SettingsCheckbox = React.memo(function SettingsCheckbox({
  checked, onChange, label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <label className="flex items-center gap-2">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="rounded border-input" />
      <span className="text-sm">{label}</span>
    </label>
  )
})

const ColorField = React.memo(function ColorField({
  value, onChange, label,
}: {
  value: string
  onChange: (v: string) => void
  label: string
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex gap-2 mt-1">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-10 h-10 rounded border cursor-pointer" />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 font-mono text-xs" />
      </div>
    </div>
  )
})

const ImageUpload = React.memo(function ImageUpload({
  label, file, onFileChange, currentUrl,
}: {
  label: string
  file: File | null
  onFileChange: (f: File | null) => void
  currentUrl: string
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex gap-3 mt-1 items-start">
        {(file || currentUrl) && (
          <div className="w-24 h-24 rounded border border-border overflow-hidden flex-shrink-0 bg-muted">
            <img src={file ? URL.createObjectURL(file) : currentUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <label className="flex-1 h-24 rounded border border-dashed border-border flex items-center justify-center cursor-pointer hover:bg-accent/10 transition-colors">
          <span className="text-xs text-muted-foreground">{file || currentUrl ? 'Cambiar' : 'Subir'} imagen</span>
          <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFileChange(f) }} />
        </label>
      </div>
    </div>
  )
})

const SettingsForm = React.memo(function SettingsForm({
  onSubmit, saving, children,
}: {
  onSubmit: () => void
  saving: boolean
  children: React.ReactNode
}) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit() }} className="space-y-4">
      {children}
      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={saving}><Save size={14} className="mr-2" />{saving ? 'Guardando...' : 'Guardar'}</Button>
      </div>
    </form>
  )
})

// ── Main page ──

export default function SettingsPage() {
  const [section, setSection] = useState<SectionKey>('general')
  const [settings, setSettings] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [logoUpload, setLogoUpload] = useState<File | null>(null)
  const [faviconUpload, setFaviconUpload] = useState<File | null>(null)
  const [ogUpload, setOgUpload] = useState<File | null>(null)
  const [previewHtml, setPreviewHtml] = useState('')
  const [previewSubject, setPreviewSubject] = useState('')
  const [previewTemplate, setPreviewTemplate] = useState<'order' | 'shipping'>('order')

  useEffect(() => {
    getAllSettings().then((s) => { setSettings(s); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const PREVIEW_TEMPLATES: { key: 'order' | 'shipping'; label: string }[] = [
    { key: 'order', label: 'Confirmación de pedido' },
    { key: 'shipping', label: 'Confirmación de envío' },
  ]

  useEffect(() => {
    if (section !== 'email_templates') return
    let cancelled = false
    const tpl = settings['email_templates'] ?? DEFAULTS.email_templates
    const subject = previewTemplate === 'order' ? tpl.order_confirmation_subject ?? '' : tpl.shipping_confirmation_subject ?? ''
    const body = previewTemplate === 'order' ? tpl.order_confirmation_body ?? '' : tpl.shipping_confirmation_body ?? ''
    const t = setTimeout(async () => {
      try {
        const { subject: previewSubject, html } = await renderEmailTemplatePreview(subject, body)
        if (!cancelled) {
          setPreviewHtml(html)
          setPreviewSubject(previewSubject)
        }
      } catch {
        if (!cancelled) setPreviewHtml('')
      }
    }, 300)
    return () => { cancelled = true; clearTimeout(t) }
  }, [section, previewTemplate, settings])

  function val(key: SectionKey, field: string) {
    return settings[key]?.[field] ?? DEFAULTS[key][field]
  }

  function set(key: SectionKey, field: string, value: any) {
    setSettings((prev) => ({
      ...prev,
      [key]: { ...(prev[key] ?? DEFAULTS[key]), [field]: value },
    }))
  }

  const makeOnChange = useCallback((key: SectionKey, field: string) => {
    return (value: any) => set(key, field, value)
  }, [])

  async function save(key: SectionKey) {
    setSaving(true)
    let data: any = settings[key] ?? DEFAULTS[key]
    try {
      if (key === 'notifications') {
        const { webhook_url, ...rest } = data
        const email = typeof rest.notification_email === 'string' ? rest.notification_email.trim() : ''
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          toast.error('El correo electrónico de notificaciones no es válido')
          setSaving(false)
          return
        }
        data = { ...rest, notification_email: email }
      }
      if (key === 'logo') {
        const fd = new FormData()
        fd.append('key', key)
        fd.append('value', JSON.stringify(data))
        if (logoUpload) { fd.append('logo_image', logoUpload) }
        if (faviconUpload) { fd.append('favicon_image', faviconUpload) }
        const res = await saveSetting(fd)
        if (res?.error) { toast.error(res.error); setSaving(false); return }
        setSettings((prev) => ({ ...prev, [key]: res.value ?? data }))
        setLogoUpload(null)
        setFaviconUpload(null)
      } else if (key === 'seo' && ogUpload) {
        const fd = new FormData()
        fd.append('key', key)
        fd.append('value', JSON.stringify(data))
        fd.append('og_image', ogUpload)
        const res = await saveSetting(fd)
        if (res?.error) { toast.error(res.error); setSaving(false); return }
        setSettings((prev) => ({ ...prev, [key]: res.value ?? data }))
        setOgUpload(null)
      } else {
        const res = await updateSetting(key, data)
        if (res?.error) { toast.error(res.error); setSaving(false); return }
        setSettings((prev) => ({ ...prev, [key]: data }))
      }
      toast.success(`${SECTIONS.find((s) => s.key === key)?.label ?? key} guardado`)
    } catch (e: any) {
      toast.error(e.message)
    }
    setSaving(false)
  }

  const handleSave = useCallback((key: SectionKey) => () => save(key), [save, section])

  if (loading) {
    return <div className="space-y-4"><div className="h-8 w-32 bg-muted rounded animate-pulse" /><div className="flex gap-4"><div className="w-48 h-96 bg-muted rounded animate-pulse" /><div className="flex-1 h-96 bg-muted rounded-lg animate-pulse" /></div></div>
  }

  const activeSection = SECTIONS.find((s) => s.key === section)!

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display tracking-wider text-foreground">Ajustes</h1>
        <p className="text-sm text-muted-foreground mt-1">Configura las preferencias de tu tienda</p>
      </div>

      <div className="flex gap-6">
        <div className="w-48 flex-shrink-0 space-y-0.5">
          {SECTIONS.map((s) => {
            const Icon = s.icon
            return (
              <button key={s.key} onClick={() => setSection(s.key)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-left transition-all ${
                  section === s.key ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-accent/10'
                }`}
              >
                <Icon size={14} strokeWidth={section === s.key ? 2 : 1.5} />
                <span className="truncate">{s.label}</span>
              </button>
            )
          })}
        </div>

        <div className="flex-1 min-w-0">
          <Card>
            <CardContent className="p-6 pt-6">
              <div className="flex items-center gap-2 mb-6 pb-4">
                <activeSection.icon size={18} className="text-primary" />
                <div>
                  <h2 className="text-lg font-medium text-foreground">{activeSection.label}</h2>
                  <p className="text-xs text-muted-foreground">{activeSection.description}</p>
                </div>
              </div>

              {section === 'general' && (
                <SettingsForm onSubmit={() => save('general')} saving={saving}>
                  <SettingsField label="Nombre de la tienda" value={val('general', 'store_name')} onChange={makeOnChange('general', 'store_name')} placeholder="Favsupply" />
                  <SettingsField label="Descripción de la tienda" value={val('general', 'store_description')} onChange={makeOnChange('general', 'store_description')} placeholder="Marca de moda de lujo" type="textarea" />
                  <SettingsField label="Moneda" value={val('general', 'store_currency')} onChange={makeOnChange('general', 'store_currency')} options={[{ value: 'USD', label: 'USD ($)' }, { value: 'EUR', label: 'EUR (€)' }, { value: 'GBP', label: 'GBP (£)' }]} />
                  <SettingsField label="Zona horaria" value={val('general', 'store_timezone')} onChange={makeOnChange('general', 'store_timezone')} options={[{ value: 'America/New_York', label: 'Este (EST)' }, { value: 'America/Chicago', label: 'Central (CST)' }, { value: 'America/Denver', label: 'Montaña (MST)' }, { value: 'America/Los_Angeles', label: 'Pacífico (PST)' }, { value: 'Europe/London', label: 'Londres (GMT)' }, { value: 'UTC', label: 'UTC' }]} />
                  <SettingsField label="Idioma" value={val('general', 'store_language')} onChange={makeOnChange('general', 'store_language')} options={[{ value: 'en', label: 'Inglés' }, { value: 'es', label: 'Español' }, { value: 'fr', label: 'Francés' }]} />
                </SettingsForm>
              )}

              {section === 'store' && (
                <SettingsForm onSubmit={() => save('store')} saving={saving}>
                  <SettingsField label="Email de contacto" value={val('store', 'email')} onChange={makeOnChange('store', 'email')} type="email" placeholder="hello@favsupply.com" />
                  <SettingsField label="Teléfono" value={val('store', 'phone')} onChange={makeOnChange('store', 'phone')} placeholder="+1 (555) 000-0000" />
                  <SettingsField label="Dirección (línea 1)" value={val('store', 'address_line1')} onChange={makeOnChange('store', 'address_line1')} placeholder="123 Luxury Ave" />
                  <SettingsField label="Dirección (línea 2)" value={val('store', 'address_line2')} onChange={makeOnChange('store', 'address_line2')} placeholder="Suite 100" />
                  <div className="grid grid-cols-3 gap-3">
                    <SettingsField label="Ciudad" value={val('store', 'city')} onChange={makeOnChange('store', 'city')} />
                    <SettingsField label="Provincia/Estado" value={val('store', 'state')} onChange={makeOnChange('store', 'state')} />
                    <SettingsField label="Código postal" value={val('store', 'zip')} onChange={makeOnChange('store', 'zip')} />
                  </div>
                  <SettingsField label="País" value={val('store', 'country')} onChange={makeOnChange('store', 'country')} options={[{ value: 'US', label: 'Estados Unidos' }, { value: 'CA', label: 'Canadá' }, { value: 'GB', label: 'Reino Unido' }, { value: 'FR', label: 'Francia' }, { value: 'IT', label: 'Italia' }, { value: 'ES', label: 'España' }]} />
                </SettingsForm>
              )}

              {section === 'brand' && (
                <SettingsForm onSubmit={() => save('brand')} saving={saving}>
                  <SettingsField label="Nombre de la marca" value={val('brand', 'brand_name')} onChange={makeOnChange('brand', 'brand_name')} />
                  <SettingsField label="Eslogan" value={val('brand', 'brand_tagline')} onChange={makeOnChange('brand', 'brand_tagline')} placeholder="Lujo redefinido" />
                  <SettingsField label="Acerca de" value={val('brand', 'brand_about')} onChange={makeOnChange('brand', 'brand_about')} type="textarea" rows={5} placeholder="Cuenta la historia de tu marca..." />
                </SettingsForm>
              )}

              {section === 'logo' && (
                <SettingsForm onSubmit={() => save('logo')} saving={saving}>
                  <ImageUpload label="Logo de la tienda" file={logoUpload} onFileChange={setLogoUpload} currentUrl={val('logo', 'logo_url')} />
                  <SettingsField label="Texto alternativo del logo" value={val('logo', 'logo_alt')} onChange={makeOnChange('logo', 'logo_alt')} />
                  <ImageUpload label="Favicon" file={faviconUpload} onFileChange={setFaviconUpload} currentUrl={val('logo', 'favicon_url')} />
                </SettingsForm>
              )}

              {section === 'colors' && (
                <SettingsForm onSubmit={() => save('colors')} saving={saving}>
                  <div className="grid grid-cols-2 gap-4">
                    <ColorField label="Primario (Oro)" value={val('colors', 'primary')} onChange={makeOnChange('colors', 'primary')} />
                    <ColorField label="Secundario (Negro)" value={val('colors', 'secondary')} onChange={makeOnChange('colors', 'secondary')} />
                    <ColorField label="Acento (Marfil)" value={val('colors', 'accent')} onChange={makeOnChange('colors', 'accent')} />
                    <ColorField label="Fondo" value={val('colors', 'background')} onChange={makeOnChange('colors', 'background')} />
                    <ColorField label="Texto" value={val('colors', 'text')} onChange={makeOnChange('colors', 'text')} />
                  </div>
                </SettingsForm>
              )}

              {section === 'typography' && (
                <SettingsForm onSubmit={() => save('typography')} saving={saving}>
                  <SettingsField label="Fuente de títulos" value={val('typography', 'heading_font')} onChange={makeOnChange('typography', 'heading_font')} options={[{ value: 'Cormorant Garamond', label: 'Cormorant Garamond' }, { value: 'Playfair Display', label: 'Playfair Display' }, { value: 'Georgia', label: 'Georgia' }, { value: 'Times New Roman', label: 'Times New Roman' }]} />
                  <SettingsField label="Fuente del cuerpo" value={val('typography', 'body_font')} onChange={makeOnChange('typography', 'body_font')} options={[{ value: 'Inter', label: 'Inter' }, { value: 'Helvetica', label: 'Helvetica' }, { value: 'Arial', label: 'Arial' }, { value: 'System', label: 'Predeterminada del sistema' }]} />
                  <SettingsField label="Tamaño de fuente base (px)" value={val('typography', 'base_font_size')} onChange={makeOnChange('typography', 'base_font_size')} type="number" />
                </SettingsForm>
              )}

              {section === 'payments' && (
                <SettingsForm onSubmit={() => save('payments')} saving={saving}>
                  <p className="text-xs text-muted-foreground -mb-2">Configuración de Stripe</p>
                  <SettingsField label="Clave pública" value={val('payments', 'stripe_publishable_key')} onChange={makeOnChange('payments', 'stripe_publishable_key')} placeholder="pk_live_..." type="password" />
                  <SettingsField label="Clave secreta" value={val('payments', 'stripe_secret_key')} onChange={makeOnChange('payments', 'stripe_secret_key')} placeholder="sk_live_..." type="password" />
                  <SettingsField label="Secreto de webhook" value={val('payments', 'stripe_webhook_secret')} onChange={makeOnChange('payments', 'stripe_webhook_secret')} placeholder="whsec_..." type="password" />
                  <div className="pt-3 mt-2">
                    <p className="text-xs text-muted-foreground mb-2">Configuración de PayPal</p>
                    <SettingsField label="ID de cliente de PayPal" value={val('payments', 'paypal_client_id')} onChange={makeOnChange('payments', 'paypal_client_id')} placeholder="Ae_..." type="password" />
                  </div>
                  <SettingsCheckbox label="Modo de prueba / sandbox" checked={val('payments', 'test_mode')} onChange={makeOnChange('payments', 'test_mode')} />
                  <div className="pt-3 mt-2">
                    <p className="text-xs text-muted-foreground mb-2">Bizum</p>
                    <SettingsCheckbox label="Activar pago con Bizum" checked={val('payments', 'bizum_enabled')} onChange={makeOnChange('payments', 'bizum_enabled')} />
                    <SettingsField label="Número de teléfono Bizum" value={val('payments', 'bizum_phone')} onChange={makeOnChange('payments', 'bizum_phone')} placeholder="+34 600 000 000" />
                  </div>
                </SettingsForm>
              )}

              {section === 'shipping' && (
                <SettingsForm onSubmit={() => save('shipping')} saving={saving}>
                  <SettingsField label={`Tarifa de envío fija (${val('general', 'store_currency') || 'USD'})`} value={val('shipping', 'shipping_rate')} onChange={makeOnChange('shipping', 'shipping_rate')} type="number" placeholder="10" />
                  <SettingsField label={`Umbral de envío gratis (${val('general', 'store_currency') || 'USD'})`} value={val('shipping', 'free_shipping_threshold')} onChange={makeOnChange('shipping', 'free_shipping_threshold')} type="number" />
                  <SettingsField label={`Tarifa de manipulación (${val('general', 'store_currency') || 'USD'})`} value={val('shipping', 'handling_fee')} onChange={makeOnChange('shipping', 'handling_fee')} type="number" />
                  <SettingsField label="Unidad de peso" value={val('shipping', 'default_weight_unit')} onChange={makeOnChange('shipping', 'default_weight_unit')} options={[{ value: 'lbs', label: 'Libras (lbs)' }, { value: 'oz', label: 'Onzas (oz)' }, { value: 'kg', label: 'Kilogramos (kg)' }, { value: 'g', label: 'Gramos (g)' }]} />
                  <SettingsField label="Zonas de envío (JSON)" value={val('shipping', 'shipping_zones')} onChange={makeOnChange('shipping', 'shipping_zones')} type="textarea" rows={5} placeholder='[{"name":"Domestic","rate":10,"free_threshold":200}]' />
                </SettingsForm>
              )}

              {section === 'taxes' && (
                <SettingsForm onSubmit={() => save('taxes')} saving={saving}>
                  <SettingsField label="Tipo de impuesto por defecto (%)" value={val('taxes', 'default_tax_rate')} onChange={makeOnChange('taxes', 'default_tax_rate')} type="number" placeholder="0" />
                  <SettingsCheckbox label="Precios con impuestos incluidos" checked={val('taxes', 'tax_inclusive_pricing')} onChange={makeOnChange('taxes', 'tax_inclusive_pricing')} />
                  <SettingsCheckbox label="Cobrar impuesto en el envío" checked={val('taxes', 'charge_tax_on_shipping')} onChange={makeOnChange('taxes', 'charge_tax_on_shipping')} />
                  <SettingsField label="Jurisdicciones de impuestos (JSON)" value={val('taxes', 'tax_jurisdictions')} onChange={makeOnChange('taxes', 'tax_jurisdictions')} type="textarea" rows={5} placeholder='[{"region":"NY","rate":8.875}]' />
                </SettingsForm>
              )}

              {section === 'email_templates' && (
                <SettingsForm onSubmit={() => save('email_templates')} saving={saving}>
                  <p className="text-xs text-muted-foreground -mb-2">Confirmación de pedido</p>
                  <SettingsField label="Asunto" value={val('email_templates', 'order_confirmation_subject')} onChange={makeOnChange('email_templates', 'order_confirmation_subject')} placeholder="Pedido confirmado — #{order_number}" />
                  <SettingsField label="Cuerpo (HTML)" value={val('email_templates', 'order_confirmation_body')} onChange={makeOnChange('email_templates', 'order_confirmation_body')} type="textarea" rows={5} placeholder="<p>¡Gracias por tu pedido!</p>" />
                  <div className="pt-3 mt-2">
                    <p className="text-xs text-muted-foreground mb-2">Confirmación de envío</p>
                    <SettingsField label="Asunto" value={val('email_templates', 'shipping_confirmation_subject')} onChange={makeOnChange('email_templates', 'shipping_confirmation_subject')} placeholder="Tu pedido ha sido enviado — #{order_number}" />
                    <SettingsField label="Cuerpo (HTML)" value={val('email_templates', 'shipping_confirmation_body')} onChange={makeOnChange('email_templates', 'shipping_confirmation_body')} type="textarea" rows={5} placeholder="<p>¡Tu pedido está en camino!</p>" />
                  </div>

                  <div className="pt-4 mt-2 border-t">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs text-muted-foreground">Vista previa del correo</p>
                      <div className="flex gap-1">
                        {PREVIEW_TEMPLATES.map(({ key, label }) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setPreviewTemplate(key)}
                            className={`px-2.5 py-1 rounded-md text-xs transition-all ${
                              previewTemplate === key
                                ? 'bg-primary/10 text-primary font-medium'
                                : 'text-muted-foreground hover:text-foreground hover:bg-accent/10'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {previewSubject && (
                      <p className="text-xs text-muted-foreground mb-2">
                        Asunto: <span className="text-foreground font-medium">{previewSubject}</span>
                      </p>
                    )}
                    <iframe
                      title={`Vista previa — ${previewTemplate}`}
                      srcDoc={previewHtml}
                      className="w-full h-96 rounded-md border bg-[#e9e9ee]"
                    />
                  </div>
                </SettingsForm>
              )}

              {section === 'notifications' && (
                <SettingsForm onSubmit={() => save('notifications')} saving={saving}>
                  <p className="text-xs text-muted-foreground -mb-2">Notificaciones por email</p>
                  <SettingsCheckbox label="Pedido confirmado" checked={val('notifications', 'order_confirmed')} onChange={makeOnChange('notifications', 'order_confirmed')} />
                  <SettingsCheckbox label="Pedido enviado" checked={val('notifications', 'order_shipped')} onChange={makeOnChange('notifications', 'order_shipped')} />
                  <SettingsCheckbox label="Pedido entregado" checked={val('notifications', 'order_delivered')} onChange={makeOnChange('notifications', 'order_delivered')} />
                  <SettingsCheckbox label="Alerta de stock bajo" checked={val('notifications', 'low_stock_alert')} onChange={makeOnChange('notifications', 'low_stock_alert')} />
                  <SettingsCheckbox label="Nuevo suscriptor" checked={val('notifications', 'new_subscriber')} onChange={makeOnChange('notifications', 'new_subscriber')} />
                  <div className="pt-3 mt-2">
                    <p className="text-xs text-muted-foreground mb-2">Destino de las notificaciones</p>
                    <SettingsField label="Correo electrónico" value={val('notifications', 'notification_email')} onChange={makeOnChange('notifications', 'notification_email')} type="email" placeholder="notificaciones@tutienda.com" />
                    <p className="text-xs text-muted-foreground mt-2">Las alertas seleccionadas se enviarán a esta dirección. Déjalo vacío para desactivarlas.</p>
                  </div>
                </SettingsForm>
              )}

              {section === 'seo' && (
                <SettingsForm onSubmit={() => save('seo')} saving={saving}>
                  <SettingsField label="Título de página por defecto" value={val('seo', 'global_title')} onChange={makeOnChange('seo', 'global_title')} />
                  <SettingsField label="Meta descripción por defecto" value={val('seo', 'global_description')} onChange={makeOnChange('seo', 'global_description')} type="textarea" />
                  <ImageUpload label="Imagen OG (Open Graph)" file={ogUpload} onFileChange={setOgUpload} currentUrl={val('seo', 'og_image')} />
                  <div className="pt-3 mt-2 space-y-3">
                    <p className="text-xs text-muted-foreground -mb-2">Analítica y seguimiento</p>
                    <SettingsField label="ID de Google Analytics" value={val('seo', 'google_analytics_id')} onChange={makeOnChange('seo', 'google_analytics_id')} placeholder="G-XXXXXXXXXX" />
                    <SettingsField label="ID del píxel de Facebook" value={val('seo', 'facebook_pixel_id')} onChange={makeOnChange('seo', 'facebook_pixel_id')} placeholder="1234567890" />
                  </div>
                  <div className="pt-3 mt-2 space-y-3">
                    <p className="text-xs text-muted-foreground -mb-2">Avanzado</p>
                    <SettingsField label="robots.txt" value={val('seo', 'robots_txt')} onChange={makeOnChange('seo', 'robots_txt')} type="textarea" rows={4} placeholder="User-agent: *&#10;Allow: /" />
                    <SettingsField label="Scripts personalizados en el head" value={val('seo', 'custom_head_scripts')} onChange={makeOnChange('seo', 'custom_head_scripts')} type="textarea" rows={5} placeholder="<script>...</script>" />
                  </div>
                </SettingsForm>
              )}

              {section === 'domains' && (
                <SettingsForm onSubmit={() => save('domains')} saving={saving}>
                  <SettingsField label="Dominio principal" value={val('domains', 'primary_domain')} onChange={makeOnChange('domains', 'primary_domain')} placeholder="favsupply.com" />
                  <div className="space-y-2">
                    <SettingsCheckbox label="Redirigir www a no-www" checked={val('domains', 'redirect_www')} onChange={makeOnChange('domains', 'redirect_www')} />
                    <SettingsCheckbox label="Forzar HTTPS" checked={val('domains', 'force_https')} onChange={makeOnChange('domains', 'force_https')} />
                  </div>
                  <SettingsField label="Dominios personalizados (separados por coma)" value={val('domains', 'custom_domains')} onChange={makeOnChange('domains', 'custom_domains')} placeholder="store.favsupply.com, eu.favsupply.com" />
                </SettingsForm>
              )}

              {section === 'legal' && (
                <SettingsForm onSubmit={() => save('legal')} saving={saving}>
                  <SettingsField label="Política de privacidad" value={val('legal', 'privacy_policy')} onChange={makeOnChange('legal', 'privacy_policy')} type="textarea" rows={6} />
                  <SettingsField label="Términos de servicio" value={val('legal', 'terms_of_service')} onChange={makeOnChange('legal', 'terms_of_service')} type="textarea" rows={6} />
                  <SettingsField label="Política de devoluciones" value={val('legal', 'refund_policy')} onChange={makeOnChange('legal', 'refund_policy')} type="textarea" rows={6} />
                  <SettingsField label="Política de envíos" value={val('legal', 'shipping_policy')} onChange={makeOnChange('legal', 'shipping_policy')} type="textarea" rows={6} />
                  <SettingsField label="Política de cookies" value={val('legal', 'cookie_policy')} onChange={makeOnChange('legal', 'cookie_policy')} type="textarea" rows={6} />
                </SettingsForm>
              )}

              {section === 'social' && (
                <SettingsForm onSubmit={() => save('social')} saving={saving}>
                  <div className="grid grid-cols-2 gap-4">
                    <SettingsField label="Instagram" value={val('social', 'instagram')} onChange={makeOnChange('social', 'instagram')} placeholder="https://instagram.com/favsupply" />
                    <SettingsField label="Facebook" value={val('social', 'facebook')} onChange={makeOnChange('social', 'facebook')} placeholder="https://facebook.com/favsupply" />
                    <SettingsField label="Twitter / X" value={val('social', 'twitter')} onChange={makeOnChange('social', 'twitter')} placeholder="https://twitter.com/favsupply" />
                    <SettingsField label="Pinterest" value={val('social', 'pinterest')} onChange={makeOnChange('social', 'pinterest')} placeholder="https://pinterest.com/favsupply" />
                    <SettingsField label="TikTok" value={val('social', 'tiktok')} onChange={makeOnChange('social', 'tiktok')} placeholder="https://tiktok.com/@favsupply" />
                    <SettingsField label="YouTube" value={val('social', 'youtube')} onChange={makeOnChange('social', 'youtube')} placeholder="https://youtube.com/@favsupply" />
                    <SettingsField label="LinkedIn" value={val('social', 'linkedin')} onChange={makeOnChange('social', 'linkedin')} placeholder="https://linkedin.com/company/favsupply" />
                  </div>
                </SettingsForm>
              )}

              {section === 'news_ticker' && (
                <SettingsForm onSubmit={() => save('news_ticker')} saving={saving}>
                  <SettingsCheckbox label="Activar barra de anuncios" checked={val('news_ticker', 'enabled')} onChange={makeOnChange('news_ticker', 'enabled')} />
                  <SettingsField label="Texto del anuncio" value={val('news_ticker', 'text')} onChange={makeOnChange('news_ticker', 'text')} placeholder="Envío gratis en pedidos superiores a 200 € — Usa el código FREESHIP" />
                  <p className="text-xs text-muted-foreground">Déjalo vacío para ocultar la barra. Se admite HTML para enlaces.</p>
                </SettingsForm>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

