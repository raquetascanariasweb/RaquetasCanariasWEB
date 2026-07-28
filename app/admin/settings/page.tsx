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
import { toast } from 'sonner'

type SectionKey =
  | 'general' | 'store' | 'brand' | 'logo' | 'colors' | 'typography'
  | 'payments' | 'shipping' | 'taxes' | 'email_templates' | 'notifications'
  | 'seo' | 'domains' | 'legal' | 'social' | 'news_ticker'

const SECTIONS: { key: SectionKey; label: string; icon: any; description: string }[] = [
  { key: 'general', label: 'General', icon: Settings2, description: 'Store name, currency, language' },
  { key: 'store', label: 'Store Information', icon: Store, description: 'Address, phone, contact email' },
  { key: 'brand', label: 'Brand', icon: BadgeInfo, description: 'Brand name, tagline, about' },
  { key: 'logo', label: 'Logo', icon: Image, description: 'Logo & favicon upload' },
  { key: 'colors', label: 'Colors', icon: Palette, description: 'Brand color palette' },
  { key: 'typography', label: 'Typography', icon: Type, description: 'Font configuration' },
  { key: 'payments', label: 'Payments', icon: CreditCard, description: 'Stripe, PayPal' },
  { key: 'shipping', label: 'Shipping', icon: Truck, description: 'Zones, rates, handling' },
  { key: 'taxes', label: 'Taxes', icon: Receipt, description: 'Tax rates & settings' },
  { key: 'email_templates', label: 'Email Templates', icon: FileText, description: 'Order, shipping emails' },
  { key: 'notifications', label: 'Notifications', icon: Bell, description: 'Alert preferences & webhooks' },
  { key: 'seo', label: 'SEO', icon: Search, description: 'Meta, analytics, scripts' },
  { key: 'domains', label: 'Domains', icon: Globe, description: 'Custom domains & SSL' },
  { key: 'legal', label: 'Legal Pages', icon: Scale, description: 'Policies, terms, privacy' },
  { key: 'social', label: 'Social Networks', icon: Users, description: 'Social media links' },
  { key: 'news_ticker', label: 'News Ticker', icon: MessageSquare, description: 'Top announcement bar text' },
]

const DEFAULTS: Record<SectionKey, any> = {
  general: { store_name: 'Favsupply', store_description: '', store_currency: 'USD', store_timezone: 'America/New_York', store_language: 'en' },
  store: { address_line1: '', address_line2: '', city: '', state: '', zip: '', country: 'US', phone: '', email: '' },
  brand: { brand_name: 'Favsupply', brand_tagline: '', brand_about: '' },
  logo: { logo_url: '', logo_alt: 'Favsupply', favicon_url: '' },
  colors: { primary: '#c9a962', secondary: '#0a0a0a', accent: '#f5f2eb', background: '#0a0a0a', text: '#f5f2eb' },
  typography: { heading_font: 'Cormorant Garamond', body_font: 'Inter', base_font_size: 16 },
  payments: { stripe_publishable_key: '', stripe_secret_key: '', stripe_webhook_secret: '', paypal_client_id: '', test_mode: true },
  shipping: { shipping_rate: 10, free_shipping_threshold: 200, default_weight_unit: 'lbs', handling_fee: 0, shipping_zones: '' },
  taxes: { default_tax_rate: 0, tax_inclusive_pricing: false, charge_tax_on_shipping: false, tax_jurisdictions: '' },
  email_templates: { order_confirmation_subject: 'Order Confirmed â€” #{order_number}', order_confirmation_body: '', shipping_confirmation_subject: 'Your Order Has Shipped â€” #{order_number}', shipping_confirmation_body: '' },
  notifications: { order_confirmed: true, order_shipped: true, order_delivered: true, low_stock_alert: true, new_subscriber: false, webhook_url: '' },
  seo: { global_title: 'Favsupply â€” Luxury Fashion', global_description: '', og_image: '', google_analytics_id: '', facebook_pixel_id: '', robots_txt: '', custom_head_scripts: '' },
  domains: { primary_domain: 'favsupply.com', redirect_www: true, force_https: true, custom_domains: '' },
  legal: { privacy_policy: '', terms_of_service: '', refund_policy: '', shipping_policy: '', cookie_policy: '' },
  social: { instagram: '', facebook: '', twitter: '', pinterest: '', tiktok: '', youtube: '', linkedin: '' },
  news_ticker: { enabled: false, text: '' },
}

// â”€â”€ Extracted memoized input components â”€â”€

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
          <span className="text-xs text-muted-foreground">{file || currentUrl ? 'Change' : 'Upload'} image</span>
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
        <Button type="submit" disabled={saving}><Save size={14} className="mr-2" />{saving ? 'Saving...' : 'Save'}</Button>
      </div>
    </form>
  )
})

// â”€â”€ Main page â”€â”€

export default function SettingsPage() {
  const [section, setSection] = useState<SectionKey>('general')
  const [settings, setSettings] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [logoUpload, setLogoUpload] = useState<File | null>(null)
  const [faviconUpload, setFaviconUpload] = useState<File | null>(null)
  const [ogUpload, setOgUpload] = useState<File | null>(null)

  useEffect(() => {
    getAllSettings().then((s) => { setSettings(s); setLoading(false) }).catch(() => setLoading(false))
  }, [])

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
    const data = settings[key] ?? DEFAULTS[key]
    try {
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
      toast.success(`${SECTIONS.find((s) => s.key === key)?.label ?? key} saved`)
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
        <h1 className="text-2xl font-serif tracking-wider text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure your store preferences</p>
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
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border">
                <activeSection.icon size={18} className="text-primary" />
                <div>
                  <h2 className="text-lg font-medium text-foreground">{activeSection.label}</h2>
                  <p className="text-xs text-muted-foreground">{activeSection.description}</p>
                </div>
              </div>

              {section === 'general' && (
                <SettingsForm onSubmit={() => save('general')} saving={saving}>
                  <SettingsField label="Store Name" value={val('general', 'store_name')} onChange={makeOnChange('general', 'store_name')} placeholder="Favsupply" />
                  <SettingsField label="Store Description" value={val('general', 'store_description')} onChange={makeOnChange('general', 'store_description')} placeholder="Luxury fashion brand" type="textarea" />
                  <SettingsField label="Currency" value={val('general', 'store_currency')} onChange={makeOnChange('general', 'store_currency')} options={[{ value: 'USD', label: 'USD ($)' }, { value: 'EUR', label: 'EUR (â‚¬)' }, { value: 'GBP', label: 'GBP (Â£)' }]} />
                  <SettingsField label="Timezone" value={val('general', 'store_timezone')} onChange={makeOnChange('general', 'store_timezone')} options={[{ value: 'America/New_York', label: 'Eastern (EST)' }, { value: 'America/Chicago', label: 'Central (CST)' }, { value: 'America/Denver', label: 'Mountain (MST)' }, { value: 'America/Los_Angeles', label: 'Pacific (PST)' }, { value: 'Europe/London', label: 'London (GMT)' }, { value: 'UTC', label: 'UTC' }]} />
                  <SettingsField label="Language" value={val('general', 'store_language')} onChange={makeOnChange('general', 'store_language')} options={[{ value: 'en', label: 'English' }, { value: 'es', label: 'Spanish' }, { value: 'fr', label: 'French' }]} />
                </SettingsForm>
              )}

              {section === 'store' && (
                <SettingsForm onSubmit={() => save('store')} saving={saving}>
                  <SettingsField label="Contact Email" value={val('store', 'email')} onChange={makeOnChange('store', 'email')} type="email" placeholder="hello@favsupply.com" />
                  <SettingsField label="Phone" value={val('store', 'phone')} onChange={makeOnChange('store', 'phone')} placeholder="+1 (555) 000-0000" />
                  <SettingsField label="Address Line 1" value={val('store', 'address_line1')} onChange={makeOnChange('store', 'address_line1')} placeholder="123 Luxury Ave" />
                  <SettingsField label="Address Line 2" value={val('store', 'address_line2')} onChange={makeOnChange('store', 'address_line2')} placeholder="Suite 100" />
                  <div className="grid grid-cols-3 gap-3">
                    <SettingsField label="City" value={val('store', 'city')} onChange={makeOnChange('store', 'city')} />
                    <SettingsField label="State" value={val('store', 'state')} onChange={makeOnChange('store', 'state')} />
                    <SettingsField label="ZIP Code" value={val('store', 'zip')} onChange={makeOnChange('store', 'zip')} />
                  </div>
                  <SettingsField label="Country" value={val('store', 'country')} onChange={makeOnChange('store', 'country')} options={[{ value: 'US', label: 'United States' }, { value: 'CA', label: 'Canada' }, { value: 'GB', label: 'United Kingdom' }, { value: 'FR', label: 'France' }, { value: 'IT', label: 'Italy' }, { value: 'ES', label: 'Spain' }]} />
                </SettingsForm>
              )}

              {section === 'brand' && (
                <SettingsForm onSubmit={() => save('brand')} saving={saving}>
                  <SettingsField label="Brand Name" value={val('brand', 'brand_name')} onChange={makeOnChange('brand', 'brand_name')} />
                  <SettingsField label="Tagline" value={val('brand', 'brand_tagline')} onChange={makeOnChange('brand', 'brand_tagline')} placeholder="Luxury Redefined" />
                  <SettingsField label="About" value={val('brand', 'brand_about')} onChange={makeOnChange('brand', 'brand_about')} type="textarea" rows={5} placeholder="Tell your brand story..." />
                </SettingsForm>
              )}

              {section === 'logo' && (
                <SettingsForm onSubmit={() => save('logo')} saving={saving}>
                  <ImageUpload label="Store Logo" file={logoUpload} onFileChange={setLogoUpload} currentUrl={val('logo', 'logo_url')} />
                  <SettingsField label="Logo Alt Text" value={val('logo', 'logo_alt')} onChange={makeOnChange('logo', 'logo_alt')} />
                  <ImageUpload label="Favicon" file={faviconUpload} onFileChange={setFaviconUpload} currentUrl={val('logo', 'favicon_url')} />
                </SettingsForm>
              )}

              {section === 'colors' && (
                <SettingsForm onSubmit={() => save('colors')} saving={saving}>
                  <div className="grid grid-cols-2 gap-4">
                    <ColorField label="Primary (Gold)" value={val('colors', 'primary')} onChange={makeOnChange('colors', 'primary')} />
                    <ColorField label="Secondary (Black)" value={val('colors', 'secondary')} onChange={makeOnChange('colors', 'secondary')} />
                    <ColorField label="Accent (Ivory)" value={val('colors', 'accent')} onChange={makeOnChange('colors', 'accent')} />
                    <ColorField label="Background" value={val('colors', 'background')} onChange={makeOnChange('colors', 'background')} />
                    <ColorField label="Text" value={val('colors', 'text')} onChange={makeOnChange('colors', 'text')} />
                  </div>
                </SettingsForm>
              )}

              {section === 'typography' && (
                <SettingsForm onSubmit={() => save('typography')} saving={saving}>
                  <SettingsField label="Heading Font" value={val('typography', 'heading_font')} onChange={makeOnChange('typography', 'heading_font')} options={[{ value: 'Cormorant Garamond', label: 'Cormorant Garamond' }, { value: 'Playfair Display', label: 'Playfair Display' }, { value: 'Georgia', label: 'Georgia' }, { value: 'Times New Roman', label: 'Times New Roman' }]} />
                  <SettingsField label="Body Font" value={val('typography', 'body_font')} onChange={makeOnChange('typography', 'body_font')} options={[{ value: 'Inter', label: 'Inter' }, { value: 'Helvetica', label: 'Helvetica' }, { value: 'Arial', label: 'Arial' }, { value: 'System', label: 'System Default' }]} />
                  <SettingsField label="Base Font Size (px)" value={val('typography', 'base_font_size')} onChange={makeOnChange('typography', 'base_font_size')} type="number" />
                </SettingsForm>
              )}

              {section === 'payments' && (
                <SettingsForm onSubmit={() => save('payments')} saving={saving}>
                  <p className="text-xs text-muted-foreground -mb-2">Stripe Configuration</p>
                  <SettingsField label="Publishable Key" value={val('payments', 'stripe_publishable_key')} onChange={makeOnChange('payments', 'stripe_publishable_key')} placeholder="pk_live_..." type="password" />
                  <SettingsField label="Secret Key" value={val('payments', 'stripe_secret_key')} onChange={makeOnChange('payments', 'stripe_secret_key')} placeholder="sk_live_..." type="password" />
                  <SettingsField label="Webhook Secret" value={val('payments', 'stripe_webhook_secret')} onChange={makeOnChange('payments', 'stripe_webhook_secret')} placeholder="whsec_..." type="password" />
                  <div className="border-t border-border pt-3 mt-2">
                    <p className="text-xs text-muted-foreground mb-2">PayPal Configuration</p>
                    <SettingsField label="PayPal Client ID" value={val('payments', 'paypal_client_id')} onChange={makeOnChange('payments', 'paypal_client_id')} placeholder="Ae_..." type="password" />
                  </div>
                  <SettingsCheckbox label="Test / Sandbox Mode" checked={val('payments', 'test_mode')} onChange={makeOnChange('payments', 'test_mode')} />
                </SettingsForm>
              )}

              {section === 'shipping' && (
                <SettingsForm onSubmit={() => save('shipping')} saving={saving}>
                  <SettingsField label={`Flat Shipping Rate (${val('general', 'store_currency') || 'USD'})`} value={val('shipping', 'shipping_rate')} onChange={makeOnChange('shipping', 'shipping_rate')} type="number" placeholder="10" />
                  <SettingsField label={`Free Shipping Threshold (${val('general', 'store_currency') || 'USD'})`} value={val('shipping', 'free_shipping_threshold')} onChange={makeOnChange('shipping', 'free_shipping_threshold')} type="number" />
                  <SettingsField label={`Handling Fee (${val('general', 'store_currency') || 'USD'})`} value={val('shipping', 'handling_fee')} onChange={makeOnChange('shipping', 'handling_fee')} type="number" />
                  <SettingsField label="Weight Unit" value={val('shipping', 'default_weight_unit')} onChange={makeOnChange('shipping', 'default_weight_unit')} options={[{ value: 'lbs', label: 'Pounds (lbs)' }, { value: 'oz', label: 'Ounces (oz)' }, { value: 'kg', label: 'Kilograms (kg)' }, { value: 'g', label: 'Grams (g)' }]} />
                  <SettingsField label="Shipping Zones (JSON)" value={val('shipping', 'shipping_zones')} onChange={makeOnChange('shipping', 'shipping_zones')} type="textarea" rows={5} placeholder='[{"name":"Domestic","rate":10,"free_threshold":200}]' />
                </SettingsForm>
              )}

              {section === 'taxes' && (
                <SettingsForm onSubmit={() => save('taxes')} saving={saving}>
                  <SettingsField label="Default Tax Rate (%)" value={val('taxes', 'default_tax_rate')} onChange={makeOnChange('taxes', 'default_tax_rate')} type="number" placeholder="0" />
                  <SettingsCheckbox label="Tax-inclusive pricing" checked={val('taxes', 'tax_inclusive_pricing')} onChange={makeOnChange('taxes', 'tax_inclusive_pricing')} />
                  <SettingsCheckbox label="Charge tax on shipping" checked={val('taxes', 'charge_tax_on_shipping')} onChange={makeOnChange('taxes', 'charge_tax_on_shipping')} />
                  <SettingsField label="Tax Jurisdictions (JSON)" value={val('taxes', 'tax_jurisdictions')} onChange={makeOnChange('taxes', 'tax_jurisdictions')} type="textarea" rows={5} placeholder='[{"region":"NY","rate":8.875}]' />
                </SettingsForm>
              )}

              {section === 'email_templates' && (
                <SettingsForm onSubmit={() => save('email_templates')} saving={saving}>
                  <p className="text-xs text-muted-foreground -mb-2">Order Confirmation</p>
                  <SettingsField label="Subject" value={val('email_templates', 'order_confirmation_subject')} onChange={makeOnChange('email_templates', 'order_confirmation_subject')} placeholder="Order Confirmed â€” #{order_number}" />
                  <SettingsField label="Body (HTML)" value={val('email_templates', 'order_confirmation_body')} onChange={makeOnChange('email_templates', 'order_confirmation_body')} type="textarea" rows={5} placeholder="<p>Thank you for your order!</p>" />
                  <div className="border-t border-border pt-3 mt-2">
                    <p className="text-xs text-muted-foreground mb-2">Shipping Confirmation</p>
                    <SettingsField label="Subject" value={val('email_templates', 'shipping_confirmation_subject')} onChange={makeOnChange('email_templates', 'shipping_confirmation_subject')} placeholder="Your Order Has Shipped â€” #{order_number}" />
                    <SettingsField label="Body (HTML)" value={val('email_templates', 'shipping_confirmation_body')} onChange={makeOnChange('email_templates', 'shipping_confirmation_body')} type="textarea" rows={5} placeholder="<p>Your order is on its way!</p>" />
                  </div>
                </SettingsForm>
              )}

              {section === 'notifications' && (
                <SettingsForm onSubmit={() => save('notifications')} saving={saving}>
                  <p className="text-xs text-muted-foreground -mb-2">Email Notifications</p>
                  <SettingsCheckbox label="Order confirmed" checked={val('notifications', 'order_confirmed')} onChange={makeOnChange('notifications', 'order_confirmed')} />
                  <SettingsCheckbox label="Order shipped" checked={val('notifications', 'order_shipped')} onChange={makeOnChange('notifications', 'order_shipped')} />
                  <SettingsCheckbox label="Order delivered" checked={val('notifications', 'order_delivered')} onChange={makeOnChange('notifications', 'order_delivered')} />
                  <SettingsCheckbox label="Low stock alert" checked={val('notifications', 'low_stock_alert')} onChange={makeOnChange('notifications', 'low_stock_alert')} />
                  <SettingsCheckbox label="New subscriber" checked={val('notifications', 'new_subscriber')} onChange={makeOnChange('notifications', 'new_subscriber')} />
                  <div className="border-t border-border pt-3 mt-2">
                    <p className="text-xs text-muted-foreground mb-2">Webhook</p>
                    <SettingsField label="Webhook URL" value={val('notifications', 'webhook_url')} onChange={makeOnChange('notifications', 'webhook_url')} placeholder="https://hooks.example.com/notify" />
                  </div>
                </SettingsForm>
              )}

              {section === 'seo' && (
                <SettingsForm onSubmit={() => save('seo')} saving={saving}>
                  <SettingsField label="Default Page Title" value={val('seo', 'global_title')} onChange={makeOnChange('seo', 'global_title')} />
                  <SettingsField label="Default Meta Description" value={val('seo', 'global_description')} onChange={makeOnChange('seo', 'global_description')} type="textarea" />
                  <ImageUpload label="OG Image (Open Graph)" file={ogUpload} onFileChange={setOgUpload} currentUrl={val('seo', 'og_image')} />
                  <div className="border-t border-border pt-3 mt-2 space-y-3">
                    <p className="text-xs text-muted-foreground -mb-2">Analytics & Tracking</p>
                    <SettingsField label="Google Analytics ID" value={val('seo', 'google_analytics_id')} onChange={makeOnChange('seo', 'google_analytics_id')} placeholder="G-XXXXXXXXXX" />
                    <SettingsField label="Facebook Pixel ID" value={val('seo', 'facebook_pixel_id')} onChange={makeOnChange('seo', 'facebook_pixel_id')} placeholder="1234567890" />
                  </div>
                  <div className="border-t border-border pt-3 mt-2 space-y-3">
                    <p className="text-xs text-muted-foreground -mb-2">Advanced</p>
                    <SettingsField label="robots.txt" value={val('seo', 'robots_txt')} onChange={makeOnChange('seo', 'robots_txt')} type="textarea" rows={4} placeholder="User-agent: *&#10;Allow: /" />
                    <SettingsField label="Custom Head Scripts" value={val('seo', 'custom_head_scripts')} onChange={makeOnChange('seo', 'custom_head_scripts')} type="textarea" rows={5} placeholder="<script>...</script>" />
                  </div>
                </SettingsForm>
              )}

              {section === 'domains' && (
                <SettingsForm onSubmit={() => save('domains')} saving={saving}>
                  <SettingsField label="Primary Domain" value={val('domains', 'primary_domain')} onChange={makeOnChange('domains', 'primary_domain')} placeholder="favsupply.com" />
                  <div className="space-y-2">
                    <SettingsCheckbox label="Redirect www to non-www" checked={val('domains', 'redirect_www')} onChange={makeOnChange('domains', 'redirect_www')} />
                    <SettingsCheckbox label="Force HTTPS" checked={val('domains', 'force_https')} onChange={makeOnChange('domains', 'force_https')} />
                  </div>
                  <SettingsField label="Custom Domains (comma separated)" value={val('domains', 'custom_domains')} onChange={makeOnChange('domains', 'custom_domains')} placeholder="store.favsupply.com, eu.favsupply.com" />
                </SettingsForm>
              )}

              {section === 'legal' && (
                <SettingsForm onSubmit={() => save('legal')} saving={saving}>
                  <SettingsField label="Privacy Policy" value={val('legal', 'privacy_policy')} onChange={makeOnChange('legal', 'privacy_policy')} type="textarea" rows={6} />
                  <SettingsField label="Terms of Service" value={val('legal', 'terms_of_service')} onChange={makeOnChange('legal', 'terms_of_service')} type="textarea" rows={6} />
                  <SettingsField label="Refund Policy" value={val('legal', 'refund_policy')} onChange={makeOnChange('legal', 'refund_policy')} type="textarea" rows={6} />
                  <SettingsField label="Shipping Policy" value={val('legal', 'shipping_policy')} onChange={makeOnChange('legal', 'shipping_policy')} type="textarea" rows={6} />
                  <SettingsField label="Cookie Policy" value={val('legal', 'cookie_policy')} onChange={makeOnChange('legal', 'cookie_policy')} type="textarea" rows={6} />
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
                  <SettingsCheckbox label="Enable announcement bar" checked={val('news_ticker', 'enabled')} onChange={makeOnChange('news_ticker', 'enabled')} />
                  <SettingsField label="Announcement text" value={val('news_ticker', 'text')} onChange={makeOnChange('news_ticker', 'text')} placeholder="Free shipping on orders over $200 â€” Use code FREESHIP" />
                  <p className="text-xs text-muted-foreground">Leave empty to hide the bar. HTML supported for links.</p>
                </SettingsForm>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

